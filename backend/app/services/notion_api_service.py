# backend/app/services/notion_api_service.py
import os
import logging
import requests
from typing import Any, Dict, List, Optional, Union, Tuple
from urllib.parse import urlparse, quote
from cryptography.fernet import Fernet

from app.models.user import User

NOTION_API_BASE = "https://api.notion.com/v1"
NOTION_VERSION = os.getenv("NOTION_API_VERSION", "2022-06-28")
FERNET = Fernet(os.getenv("FERNET_SECRET").encode())

# API 허용 타입 (append/create 기준)
_ALLOWED_TYPES = {
    "embed","bookmark","image","video","pdf","file","audio","code","equation","divider",
    "breadcrumb","table_of_contents","link_to_page","table_row","table",
    "column_list","column","heading_1","heading_2","heading_3","paragraph",
    "bulleted_list_item","numbered_list_item","quote","to_do","toggle","template",
    "callout","synced_block"
}

EMPTY_PAYLOAD_TYPES = {"divider", "table_of_contents", "breadcrumb"}

LEAF_NO_CHILDREN = {
    "image","video","file","pdf","audio","bookmark","embed","divider",
    "table_of_contents","breadcrumb",
}

# ──────────────────────────────────────────────────────────────────────────────
# 공통 유틸
# ──────────────────────────────────────────────────────────────────────────────
def _decrypt(token_enc: str) -> str:
    return FERNET.decrypt(token_enc.encode()).decode()

def _headers(token: str) -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }

def _is_public_url(u: str) -> bool:
    try:
        netloc = urlparse(u).netloc or ""
    except Exception:
        return False
    bad_hosts = (
        "notion.so","www.notion.so","notion.site",
        "secure.notion-static.com","prod-files-secure.s3",
    )
    return bool(u.startswith(("http://", "https://"))) and not any(h in netloc for h in bad_hosts)

def _placeholder_image_url() -> str:
    url = os.getenv("NOTION_PLACEHOLDER_IMAGE") or os.getenv("PLACEHOLDER_IMAGE_URL")
    if url:
        return url
    text = quote("이미지를 넣어주세요")
    return f"https://placehold.co/1200x800?text={text}"

def _strip_readonly_keys(d: Dict[str, Any]) -> Dict[str, Any]:
    readonly = {
        "object","id","parent","created_time","last_edited_time",
        "created_by","last_edited_by","archived","in_trash",
        "has_children","request_id","url",
    }
    return {k: v for k, v in d.items() if k not in readonly}

def _transform_rich_text(rt_list: Any) -> List[Dict[str, Any]]:
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
    if not payload:
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

    if typ == "image":
        return {"type": "external", "external": {"url": _placeholder_image_url()}}
    return None

def _is_valid_block_shape(b: dict) -> Tuple[bool, str]:
    if not isinstance(b, dict):
        return False, "not a dict"
    t = b.get("type")
    if not t:
        return False, "missing type"
    if t not in _ALLOWED_TYPES:
        return False, f"unknown type '{t}'"
    payload = b.get(t)
    if not isinstance(payload, dict):
        return False, f"missing payload for type '{t}'"
    return True, ""

def _debug_first_invalid(blocks: list, label: str = "preflight"):
    for i, b in enumerate(blocks):
        ok, why = _is_valid_block_shape(b)
        if not ok:
            import json
            try:
                snippet = json.dumps(b, ensure_ascii=False)[:800]
            except Exception:
                snippet = str(b)[:800]
            logging.error(f"[Notion] INVALID BLOCK @{label}[{i}]: {why} | keys={list(b.keys())} | block={snippet}")
            return i, why
    return None, ""


# ──────────────────────────────────────────────────────────────────────────────
# 블록 변환
# ──────────────────────────────────────────────────────────────────────────────
def _transform_block_for_create(block: Dict[str, Any]) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
    b = _strip_readonly_keys(block.copy())

    extracted_children = b.pop("children", None)
    typ = b.get("type")
    container_types = {"column_list","column","template","synced_block"}

    # 래퍼/이상치 평탄화
    if (not typ) or (typ not in container_types and not b.get(typ)):
        if extracted_children:
            flattened: List[Dict[str, Any]] = []
            for ch in extracted_children:
                ch_norm = _transform_block_for_create(ch)
                if isinstance(ch_norm, list): flattened.extend(ch_norm)
                else: flattened.append(ch_norm)
            return flattened
        if typ in EMPTY_PAYLOAD_TYPES:
            b[typ] = {}
            for k in list(b.keys()):
                if k not in ("type", typ): b.pop(k, None)
            return b
        for k in list(b.keys()):
            if k not in ("type","paragraph"): b.pop(k, None)
        b["type"] = "paragraph"
        b["paragraph"] = {"rich_text":[{"type":"text","text":{"content":""}}]}
        return b

    def _fix_rich_text_in(payload_key: str):
        payload = b.get(payload_key, {}) or {}
        if "rich_text" in payload:
            payload["rich_text"] = _transform_rich_text(payload["rich_text"])
        b[payload_key] = payload

    if typ in ("paragraph","heading_1","heading_2","heading_3","callout",
               "bulleted_list_item","numbered_list_item","to_do","toggle","quote","code"):
        _fix_rich_text_in(typ)

    if typ == "image":
        norm = _normalize_media_payload("image", b.get("image", {}) or {})
        if norm is None:
            if os.getenv("NOTION_PLACEHOLDER_IMAGE"):
                b["type"] = "image"
                b["image"] = {"type":"external","external":{"url":os.getenv("NOTION_PLACEHOLDER_IMAGE")}}
                b.pop("children", None)
                return b
            b["type"] = "paragraph"
            b.pop("image", None)
            b["paragraph"] = {"rich_text":[{"type":"text","text":{"content":"[이미지 자리 비워짐]"}}]}
        else:
            b["image"] = norm
            b.pop("children", None)
            return b

    elif typ in ("video","file","pdf","audio","bookmark","embed"):
        norm = _normalize_media_payload(typ, b.get(typ, {}) or {})
        if norm is None:
            b["type"] = "paragraph"
            b.pop(typ, None)
            b["paragraph"] = {"rich_text":[{"type":"text","text":{"content":f"[{typ} 링크 제거됨]"}}]}
        else:
            b[typ] = norm
            b.pop("children", None)
            return b

    elif typ == "divider":
        b.pop("children", None)
        b["divider"] = {}
        for k in list(b.keys()):
            if k not in ("type","divider"): b.pop(k, None)
        return b

    if typ == "column_list":
        payload = b.get("column_list", {}) or {}
        payload_children = payload.get("children")
        source_children = payload_children if isinstance(payload_children, list) else extracted_children
        norm_children: List[Dict[str, Any]] = []
        if source_children:
            for ch in source_children:
                ch_norm = _transform_block_for_create(ch)
                if isinstance(ch_norm, list): norm_children.extend(ch_norm)
                else: norm_children.append(ch_norm)
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
                if isinstance(ch_norm, list): norm_children.extend(ch_norm)
                else: norm_children.append(ch_norm)
        b["column"] = {"children": norm_children}
        return b

    if typ == "template":
        payload = b.get("template", {}) or {}
        payload["rich_text"] = _transform_rich_text(payload.get("rich_text", []))
        inner_children = payload.get("children")
        source_children = inner_children if isinstance(inner_children, list) else extracted_children
        norm_children: List[Dict[str, Any]] = []
        if source_children:
            for ch in source_children:
                ch_norm = _transform_block_for_create(ch)
                if isinstance(ch_norm, list): norm_children.extend(ch_norm)
                else: norm_children.append(ch_norm)
        b["template"] = {"rich_text": payload.get("rich_text", []), "children": norm_children}
        return b

    if typ == "synced_block":
        payload = b.get("synced_block", {}) or {}
        inner_children = payload.get("children")
        source_children = inner_children if isinstance(inner_children, list) else extracted_children
        norm_children: List[Dict[str, Any]] = []
        if source_children:
            for ch in source_children:
                ch_norm = _transform_block_for_create(ch)
                if isinstance(ch_norm, list): norm_children.extend(ch_norm)
                else: norm_children.append(ch_norm)
        b["synced_block"] = {"synced_from": None, "children": norm_children}
        return b

    if typ in ("bulleted_list","numbered_list"):
        source_children = extracted_children or []
        flattened: List[Dict[str, Any]] = []
        for ch in source_children:
            ch_norm = _transform_block_for_create(ch)
            if isinstance(ch_norm, list): flattened.extend(ch_norm)
            else: flattened.append(ch_norm)
        return flattened

    flat_children: List[Dict[str, Any]] = []
    if extracted_children:
        for ch in extracted_children:
            ch_norm = _transform_block_for_create(ch)
            if isinstance(ch_norm, list): flat_children.extend(ch_norm)
            else: flat_children.append(ch_norm)

    typ_now = b.get("type")
    payload_now = b.get(typ_now) if isinstance(typ_now, str) else None
    if not isinstance(payload_now, dict):
        if flat_children: return flat_children
        return {"type":"paragraph","paragraph":{"rich_text":[{"type":"text","text":{"content":""}}]}}

    return b


def _wrap_top_level_columns(blocks: List[dict]) -> List[dict]:
    out: List[dict] = []
    pending_cols: List[dict] = []

    def flush_cols():
        nonlocal pending_cols, out
        if pending_cols:
            out.append({"type":"column_list","column_list":{"children":pending_cols}})
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
    return [lst[i:i+size] for i in range(0, len(lst), size)]


# ──────────────────────────────────────────────────────────────────────────────
# 소독/검증
# ──────────────────────────────────────────────────────────────────────────────
def _sanitize_blocks_for_create(blocks: List[dict]) -> List[dict]:
    if not isinstance(blocks, list):
        return []
    READONLY_KEYS = {
        "id","parent","object","created_time","last_edited_time",
        "created_by","last_edited_by","archived","in_trash","has_children"
    }
    out = []
    for b in blocks:
        if not isinstance(b, dict): continue
        b_type = b.get("type")
        if not b_type: continue
        payload = b.get(b_type)
        if not isinstance(payload, dict): continue

        nb = {k:v for k,v in b.items() if k not in READONLY_KEYS}
        nb[b_type] = dict(payload)

        if b_type == "column_list":
            if "children" in nb and isinstance(nb["children"], list):
                nb["children"] = _sanitize_blocks_for_create(nb["children"])
        if b_type == "column":
            col = nb.get("column", {})
            if isinstance(col, dict) and isinstance(col.get("children"), list):
                col["children"] = _sanitize_blocks_for_create(col["children"])
                nb["column"] = col
        if "children" in nb and isinstance(nb["children"], list):
            nb["children"] = _sanitize_blocks_for_create(nb["children"])
        out.append(nb)
    return out


# ──────────────────────────────────────────────────────────────────────────────
# DB 복제 & 치환
# ──────────────────────────────────────────────────────────────────────────────
_ALLOWED_PROPERTY_TYPES = {
    "title","rich_text","number","select","multi_select","date","people",
    "checkbox","url","email","phone_number","files"
}

def _safe_clone_properties(props: Dict[str, Any]) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for name, spec in (props or {}).items():
        t = spec.get("type")
        if t in _ALLOWED_PROPERTY_TYPES:
            if t == "title":
                out[name] = {"title": {}}
            else:
                out[name] = {t: spec.get(t, {})}
    if not any(v.get("title") is not None for v in out.values()):
        out = {"Name": {"title": {}}} | out
    return out

def _default_properties() -> Dict[str, Any]:
    return {
        "작업명": {"title": {}},
        "상태": {"select": {"options": [
            {"name": "진행중", "color": "yellow"},
            {"name": "완료", "color": "green"},
            {"name": "대기", "color": "red"},
        ]}},
        "시작일": {"date": {}},
        "마감일": {"date": {}},
        "참여자": {"people": {}},
    }

def create_database(user: User, parent_page_id: str, title: str,
                    properties: Optional[Dict[str, Any]] = None) -> str:
    token = _decrypt(user.notion_token)
    headers = _headers(token)
    url = f"{NOTION_API_BASE}/databases"
    body = {
        "parent": {"type": "page_id", "page_id": parent_page_id},
        "title": [{"type": "text", "text": {"content": title or "Database"}}],
        "properties": properties or _default_properties(),
    }
    r = requests.post(url, headers=headers, json=body, timeout=30)
    if r.status_code >= 300:
        raise RuntimeError(f"Notion database create failed: {r.text}")
    db_id = (r.json() or {}).get("id")
    if not db_id:
        raise RuntimeError("Notion database create failed: no id in response")
    logging.info(f"[Notion] Database created: {db_id} (title='{title}')")
    return db_id

def create_database_clone(user: User, parent_page_id: str, title: str,
                          clone_from_database_id: Optional[str]) -> str:
    props = None
    if clone_from_database_id:
        token = _decrypt(user.notion_token)
        headers = _headers(token)
        r = requests.get(f"{NOTION_API_BASE}/databases/{clone_from_database_id}",
                         headers=headers, timeout=30)
        if r.status_code < 300:
            src = r.json() or {}
            props = _safe_clone_properties(src.get("properties", {}))
        else:
            logging.warning("[Notion] Read source DB failed, fallback to default: %s", r.text)
            props = _default_properties()
    else:
        props = _default_properties()
    return create_database(user, parent_page_id, title, props)

def _replace_child_db_with_new_db_link(blocks: List[dict],
                                       mapping: Dict[str, dict]) -> List[dict]:
    """
    child_database(title) → 새 DB 생성 지시 플래그로 마킹 (후처리에서 실제 생성)
    최종 전송용이 아니라 'staged' 목록을 만든다.
    """
    out: List[dict] = []
    for b in blocks or []:
        if not isinstance(b, dict):
            continue
        t = b.get("type")

        if t == "child_database":
            title = (b.get("child_database") or {}).get("title") or "Database"
            m = mapping.get(title, {})
            out.append({"__create_new_db__": True, "title": title, "clone_from": m.get("clone_from_database_id")})
            continue

        nb = dict(b)
        if t == "column_list" and isinstance(nb.get("children"), list):
            nb["children"] = _replace_child_db_with_new_db_link(nb["children"], mapping)
        if t == "column":
            col = nb.get("column")
            if isinstance(col, dict) and isinstance(col.get("children"), list):
                col["children"] = _replace_child_db_with_new_db_link(col["children"], mapping)
                nb["column"] = col
        if isinstance(nb.get("children"), list):
            nb["children"] = _replace_child_db_with_new_db_link(nb["children"], mapping)
        out.append(nb)
    return out


# ──────────────────────────────────────────────────────────────────────────────
# 공개 API
# ──────────────────────────────────────────────────────────────────────────────
def append_blocks_to_page(user: User, page_id: str, blocks: List[dict]) -> str:
    token = _decrypt(user.notion_token)
    headers = _headers(token)
    url = f"{NOTION_API_BASE}/blocks/{page_id}/children"

    # 1) 변환
    prepared: List[Dict[str, Any]] = []
    for b in blocks:
        norm = _transform_block_for_create(b)
        if isinstance(norm, list): prepared.extend(norm)
        elif isinstance(norm, dict) and norm: prepared.append(norm)

    # 2) 1차 소독
    prepared = _sanitize_blocks_for_create(prepared)
    _debug_first_invalid(prepared, "after_sanitize#1")

    # 3) 래핑
    prepared = _wrap_top_level_columns(prepared)

    # 4) 2차 소독
    prepared = _sanitize_blocks_for_create(prepared)
    bad_idx, why = _debug_first_invalid(prepared, "after_sanitize#2")
    if bad_idx is not None:
        raise RuntimeError(f"Notion append blocked: invalid block at index {bad_idx} ({why})")

    if not prepared:
        raise RuntimeError("Notion append blocked: no valid blocks after transform/wrap/sanitize")

    for chunk in _chunk(prepared, 90):
        r = requests.patch(url, headers=headers, json={"children": chunk}, timeout=30)
        if r.status_code >= 300:
            raise RuntimeError(f"Notion append failed: {r.text}")

    return page_id


def create_on_target_and_append(user: User,
                                target_page_id: str,
                                blocks: List[dict],
                                db_clone_links_mapping: Dict[str, dict]) -> str:
    """
    새 페이지를 만들지 않고 target_page_id 에 직접 append.
    템플릿 내 child_database(title)는 '새 DB 생성 → link_to_page(database_id)'로 치환.
    """
    # 1) child_database 마킹
    staged = _replace_child_db_with_new_db_link(blocks, db_clone_links_mapping)

    # 2) 실제 새 DB 생성 + link_to_page 로 교체
    realized: List[dict] = []
    for b in staged:
        if isinstance(b, dict) and b.get("__create_new_db__"):
            title = b.get("title") or "Database"
            clone_from = b.get("clone_from")
            new_db_id = create_database_clone(user, target_page_id, title, clone_from)

            # ✅ 원본 child_database 블록을 새 DB ID로 치환해서 append
            orig = b.get("original_block")
            if orig:
                realized.append({
                    "type": "child_database",
                    "child_database": {"title": title},  # 보여지는 이름
                    "id": new_db_id                      # 새로 생성된 DB를 참조
                })
        else:
            realized.append(b)



    # 3) append
    append_blocks_to_page(user, target_page_id, realized)
    return target_page_id
