# backend/app/services/notion_api_service.py
import os
import requests
from typing import Any, Dict, List, Optional, Union
from cryptography.fernet import Fernet
from app.models.user import User
from urllib.parse import urlparse, quote

NOTION_API_BASE = "https://api.notion.com/v1"
# 생성/갱신에서 호환 잘 되는 안정 버전 기본값
NOTION_VERSION = os.getenv("NOTION_API_VERSION", "2022-06-28")

FERNET = Fernet(os.getenv("FERNET_SECRET").encode())

# children 비허용(leaf) 타입들
LEAF_NO_CHILDREN = {
    "image",
    "video",
    "file",
    "pdf",
    "audio",
    "bookmark",
    "embed",
    "divider",
    "table_of_contents",
    "breadcrumb",
    # 필요하면 "equation"도 추가 가능
}

KNOWN_TYPES = {
    "paragraph",
    "heading_1",
    "heading_2",
    "heading_3",
    "callout",
    "bulleted_list_item",
    "numbered_list_item",
    "to_do",
    "toggle",
    "quote",
    "code",
    "divider",
    "table_of_contents",
    "breadcrumb",
    "image",
    "video",
    "file",
    "pdf",
    "audio",
    "bookmark",
    "embed",
    "column_list",
    "column",
    "template",
    "synced_block",
    # 필요시: "equation", "table", "table_row", "link_to_page" 등 추가
}

EMPTY_PAYLOAD_TYPES = {"divider", "table_of_contents", "breadcrumb"}


# ──────────────────────────────────────────────────────────────────────────────
# 공통 유틸
# ──────────────────────────────────────────────────────────────────────────────

def _placeholder_image_url() -> str:
    # NOTION_PLACEHOLDER_IMAGE 우선, 없으면 PLACEHOLDER_IMAGE_URL, 둘 다 없으면 기본값
    url = os.getenv("NOTION_PLACEHOLDER_IMAGE") or os.getenv("PLACEHOLDER_IMAGE_URL")
    if url:
        return url
    text = quote("이미지를 넣어주세요")
    return f"https://placehold.co/1200x800?text={text}"


def _is_public_url(u: str) -> bool:
    try:
        netloc = urlparse(u).netloc or ""
    except Exception:
        return False
    bad_hosts = (
        "notion.so",
        "www.notion.so",
        "notion.site",
        "secure.notion-static.com",
        "prod-files-secure.s3",  # secure 노션 파일 S3
    )
    return bool(u.startswith(("http://", "https://"))) and not any(h in netloc for h in bad_hosts)


def _decrypt(token_enc: str) -> str:
    return FERNET.decrypt(token_enc.encode()).decode()


def _headers(token: str) -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }


def _strip_readonly_keys(d: Dict[str, Any]) -> Dict[str, Any]:
    """
    Notion 조회 응답에만 있는 읽기전용 키들을 제거 (생성 시 오류 방지)
    """
    readonly = {
        "object",
        "id",
        "parent",
        "created_time",
        "last_edited_time",
        "created_by",
        "last_edited_by",
        "archived",
        "in_trash",
        "has_children",
        "request_id",
        "url",
    }
    return {k: v for k, v in d.items() if k not in readonly}


def _transform_rich_text(rt_list: Any) -> List[Dict[str, Any]]:
    """
    rich_text 배열을 생성 스키마로 단순 정규화
    - text / mention / equation 정도만 커버
    """
    if not isinstance(rt_list, list):
        return []
    out: List[Dict[str, Any]] = []
    for rt in rt_list:
        if not isinstance(rt, dict):
            continue
        if "text" in rt:
            item: Dict[str, Any] = {"type": "text", "text": rt["text"]}
            if "annotations" in rt:
                item["annotations"] = rt["annotations"]
            if "href" in rt:
                item["href"] = rt["href"]
            out.append(item)
        elif "mention" in rt or "equation" in rt:
            out.append(rt)
    return out


def _normalize_external_url(url: Any) -> Optional[str]:
    if isinstance(url, str) and url.startswith(("http://", "https://")):
        return url
    return None


def _normalize_media_payload(typ: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Notion media payload 정규화
    - 내부 notion 파일 URL(만료/권한 필요)은 사용 금지
    - 외부 공개 URL만 허용
    - 허용 불가 시 '이미지를 넣어주세요' 플레이스홀더로 치환(이미지인 경우)
    - 그 외 타입은 None (상위에서 텍스트로 강등)
    """
    if not payload:
        # 이미지라면 플레이스홀더 반환
        if typ == "image":
            return {"type": "external", "external": {"url": _placeholder_image_url()}}
        return None

    url = None
    if payload.get("type") == "file":
        url = (payload.get("file") or {}).get("url")
    elif payload.get("type") == "external":
        url = (payload.get("external") or {}).get("url")

    if url and _is_public_url(url):
        return {"type": "external", "external": {"url": url}}

    # 공개 URL이 아니면: 이미지만 플레이스홀더, 나머지는 제거
    if typ == "image":
        return {"type": "external", "external": {"url": _placeholder_image_url()}}

    return None



# ──────────────────────────────────────────────────────────────────────────────
# 블록 변환
# ──────────────────────────────────────────────────────────────────────────────
def _transform_block_for_create(
    block: Dict[str, Any],
) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
    """
    저장된 doc_json(조회 스키마) → Notion '생성 스키마'
    - 읽기전용 키 제거
    - column_list/column: payload 내부 children 필수
    - bulleted_list/numbered_list: 컨테이너 평탄화(자식 list_item만 남김)
    - 미디어/임베드: external URL 기반 정규화, children 금지
    - template/synced_block: payload 내부 children 필수
    - 래퍼(타입/페이로드 없음): children만 평탄화 반환
    - 마지막 방어막: payload 없으면 빈 paragraph (children 달지 않음)
    """
    b = _strip_readonly_keys(block.copy())

    # 어떤 저장본은 상위 children / 어떤 저장본은 payload 내부 children
    extracted_children = b.pop("children", None)
    typ = b.get("type")

    # ── 래퍼 평탄화 가드 ──
    _CONTAINER_TYPES = {"column_list", "column", "template", "synced_block"}

    if (not typ) or (typ not in _CONTAINER_TYPES and not b.get(typ)):
        if extracted_children:
            flattened: List[Dict[str, Any]] = []
            for ch in extracted_children:
                ch_norm = _transform_block_for_create(ch)
                if isinstance(ch_norm, list):
                    flattened.extend(ch_norm)
                else:
                    flattened.append(ch_norm)
            return flattened
        if typ in EMPTY_PAYLOAD_TYPES:
            b[typ] = {}
            for k in list(b.keys()):
                if k not in ("type", typ):
                    b.pop(k, None)
            return b
        for k in list(b.keys()):
            if k not in ("type", "paragraph"):
                b.pop(k, None)
        b["type"] = "paragraph"
        b["paragraph"] = {"rich_text": [{"type": "text", "text": {"content": ""}}]}
        return b

    def _fix_rich_text_in(payload_key: str):
        payload = b.get(payload_key, {}) or {}
        if "rich_text" in payload:
            payload["rich_text"] = _transform_rich_text(payload["rich_text"])
        b[payload_key] = payload

    # 텍스트형 (children 허용)
    if typ in (
        "paragraph", "heading_1", "heading_2", "heading_3",
        "callout", "bulleted_list_item", "numbered_list_item",
        "to_do", "toggle", "quote", "code",
    ):
        _fix_rich_text_in(typ)

    if typ == "image":
        payload_in = b.get("image", {}) or {}
        norm = _normalize_media_payload("image", payload_in)

        # 정상적인 이미지가 없는 경우 → placeholder 강제 삽입
        if norm is None:
            placeholder_url = os.getenv("NOTION_PLACEHOLDER_IMAGE")
            if placeholder_url:
                b["type"] = "image"
                b["image"] = {"type": "external", "external": {"url": placeholder_url}}
                b.pop("children", None)  # children 금지
                return b
            else:
                # fallback: 빈 문단
                b["type"] = "paragraph"
                b.pop("image", None)
                b["paragraph"] = {
                    "rich_text": [
                        {"type": "text", "text": {"content": "[이미지 자리 비워짐]"}}
                    ]
                }
        else:
            b["image"] = norm
            b.pop("children", None)  # children 금지
            return b



    elif typ in ("video", "file", "pdf", "audio", "bookmark", "embed"):
        payload_in = b.get(typ, {}) or {}
        norm = _normalize_media_payload(typ, payload_in)
        if norm is None:
            b["type"] = "paragraph"
            b.pop(typ, None)
            b["paragraph"] = {
                "rich_text": [{"type": "text", "text": {"content": f"[{typ} 링크 제거됨]"}}]
            }
        else:
            b[typ] = norm
            b.pop("children", None)
            return b

    elif typ == "divider":
        b.pop("children", None)
        b["divider"] = {}
        for k in list(b.keys()):
            if k not in ("type", "divider"):
                b.pop(k, None)
        return b

    # column_list/column
    if typ == "column_list":
        payload = b.get("column_list", {}) or {}
        payload_children = payload.get("children")
        source_children = payload_children if isinstance(payload_children, list) else extracted_children
        norm_children: List[Dict[str, Any]] = []
        if source_children:
            for ch in source_children:
                ch_norm = _transform_block_for_create(ch)
                if isinstance(ch_norm, list):
                    norm_children.extend(ch_norm)
                else:
                    norm_children.append(ch_norm)
        b["column_list"] = {"children": norm_children}
        return b

    if typ == "column":
        payload = b.get("column", {}) or {}
        payload_children = payload.get("children")
        source_children = payload_children if isinstance(payload_children, list) else extracted_children
        norm_children: List[Dict[str, Any]] = []
        if source_children:
            for ch in source_children:
                ch_norm = _transform_block_for_create(ch)
                if isinstance(ch_norm, list):
                    norm_children.extend(ch_norm)
                else:
                    norm_children.append(ch_norm)
        b["column"] = {"children": norm_children}
        return b

    # template
    if typ == "template":
        payload = b.get("template", {}) or {}
        payload["rich_text"] = _transform_rich_text(payload.get("rich_text", []))
        inner_children = payload.get("children")
        source_children = inner_children if isinstance(inner_children, list) else extracted_children
        norm_children: List[Dict[str, Any]] = []
        if source_children:
            for ch in source_children:
                ch_norm = _transform_block_for_create(ch)
                if isinstance(ch_norm, list):
                    norm_children.extend(ch_norm)
                else:
                    norm_children.append(ch_norm)
        b["template"] = {"rich_text": payload.get("rich_text", []), "children": norm_children}
        return b

    # synced_block
    if typ == "synced_block":
        payload = b.get("synced_block", {}) or {}
        inner_children = payload.get("children")
        source_children = inner_children if isinstance(inner_children, list) else extracted_children
        norm_children: List[Dict[str, Any]] = []
        if source_children:
            for ch in source_children:
                ch_norm = _transform_block_for_create(ch)
                if isinstance(ch_norm, list):
                    norm_children.extend(ch_norm)
                else:
                    norm_children.append(ch_norm)
        b["synced_block"] = {"synced_from": None, "children": norm_children}
        return b

    # 리스트 컨테이너 평탄화
    if typ in ("bulleted_list", "numbered_list"):
        source_children = extracted_children or []
        flattened: List[Dict[str, Any]] = []
        for ch in source_children:
            ch_norm = _transform_block_for_create(ch)
            if isinstance(ch_norm, list):
                flattened.extend(ch_norm)
            else:
                flattened.append(ch_norm)
        return flattened

    # 알 수 없는 래퍼 처리
    flat_children: List[Dict[str, Any]] = []
    if extracted_children:
        for ch in extracted_children:
            ch_norm = _transform_block_for_create(ch)
            if isinstance(ch_norm, list):
                flat_children.extend(ch_norm)
            else:
                flat_children.append(ch_norm)

    typ_now = b.get("type")
    payload_now = b.get(typ_now) if isinstance(typ_now, str) else None

    if not isinstance(payload_now, dict):
        if flat_children:
            return flat_children
        return {"type": "paragraph", "paragraph": {"rich_text": [{"type": "text", "text": {"content": ""}}]}}

    return b


def _wrap_top_level_columns(blocks: List[dict]) -> List[dict]:
    """
    탑레벨에 'column'이 있으면 인접한 column들끼리 묶어
    column_list 한 덩어리로 감싼다.
    """
    out: List[dict] = []
    pending_cols: List[dict] = []

    def flush_cols():
        nonlocal pending_cols, out
        if pending_cols:
            out.append({
                "type": "column_list",
                "column_list": {"children": pending_cols}
            })
            pending_cols = []

    for b in blocks:
        if isinstance(b, dict) and b.get("type") == "column":
            pending_cols.append(b)
        else:
            flush_cols()
            out.append(b)
    flush_cols()
    return out


def _chunk(lst: List[Dict[str, Any]], size: int = 90) -> List[List[Dict[str, Any]]]:
    """
    Notion children append 제한(100개 근처) 대비 청크 분할
    """
    return [lst[i : i + size] for i in range(0, len(lst), size)]


# ──────────────────────────────────────────────────────────────────────────────
# 공개 API
# ──────────────────────────────────────────────────────────────────────────────
def create_child_page(user: User, parent_page_id: str, title: str) -> str:
    """
    대상 페이지(parent_page_id)의 하위에 새 Page를 만들고 그 page_id를 반환
    """
    token = _decrypt(user.notion_token)
    headers = _headers(token)

    url = f"{NOTION_API_BASE}/pages"
    payload: Dict[str, Any] = {
        "parent": {"type": "page_id", "page_id": parent_page_id},
        "properties": {"title": [{"type": "text", "text": {"content": title}}]},
    }

    r = requests.post(url, headers=headers, json=payload, timeout=30)
    if r.status_code >= 300:
        raise RuntimeError(f"Notion create page failed: {r.text}")
    data = r.json()
    return data.get("id")


def append_blocks_to_page(user: User, page_id: str, blocks: List[dict]) -> str:
    """
    target page(block)의 children에 blocks를 append
    - 저장 스키마 → 생성 스키마 정규화
    - 리스트 컨테이너 평탄화, leaf 타입 children 제거
    - 100개 제한 대비 청크 전송
    """
    token = _decrypt(user.notion_token)
    headers = _headers(token)
    url = f"{NOTION_API_BASE}/blocks/{page_id}/children"

    # 생성 스키마로 정규화 (리스트 평탄화 포함)
    prepared: List[Dict[str, Any]] = []
    for b in blocks:
        norm = _transform_block_for_create(b)
        if isinstance(norm, list):
            prepared.extend(norm)
        else:
            prepared.append(norm)
        prepared = _wrap_top_level_columns(prepared)


    for chunk in _chunk(prepared, 90):
        r = requests.patch(url, headers=headers, json={"children": chunk}, timeout=30)
        if r.status_code >= 300:
            # 디버깅 편의를 위해 서버 응답 그대로 노출
            raise RuntimeError(f"Notion append failed: {r.text}")

    return page_id


def create_page_then_append(
    user: User, parent_page_id: str, title: str, blocks: List[dict]
) -> str:
    """
    (권장) 하위 페이지를 먼저 생성한 뒤, 그 페이지의 children에 blocks를 append
    """
    new_page_id = create_child_page(user, parent_page_id, title)
    append_blocks_to_page(user, new_page_id, blocks)
    return new_page_id
