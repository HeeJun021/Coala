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
# (추가) 페이지 제목 업데이트
# ──────────────────────────────────────────────────────────────────────────────
def update_page_title(user: "User", page_id: str, title: str) -> None:
    """
    Standalone 페이지(데이터베이스가 아닌 일반 페이지)의 제목을 갱신한다.
    Notion API: PATCH /v1/pages/{page_id}
    """
    token = _decrypt(user.notion_token)
    headers = _headers(token)
    url = f"{NOTION_API_BASE}/pages/{page_id}"

    # 대부분의 스탠드얼론 페이지는 'title' 속성을 사용한다.
    payload = {
        "properties": {
            "title": [
                {"type": "text", "text": {"content": title or ""}}
            ]
        }
    }

    r = requests.patch(url, headers=headers, json=payload, timeout=30)
    if r.status_code >= 300:
        raise RuntimeError(f"Failed to update page title: {r.text}")


# ──────────────────────────────────────────────────────────────────────────────
# (추가) 1:1 대치를 위한 텍스트 치환 유틸
# ──────────────────────────────────────────────────────────────────────────────
# ──────────────────────────────────────────────────────────────────────────────
# (치환) 텍스트 대치 유틸
# ──────────────────────────────────────────────────────────────────────────────
def _replace_in_text(text: Any, kv: Dict[str, Any]) -> Any:
    """문자열의 [키], {{키}} 치환. 문자열이 아니면 그대로 반환."""
    if not isinstance(text, str) or not kv:
        return text
    out = text
    for k, v in kv.items():
        if v is None:
            continue
        val = str(v)
        out = out.replace(f"[{k}]", val)
        out = out.replace(f"{{{{{k}}}}}", val)  # {{key}}
    return out


def _replace_in_rich_text_list(rt_list: Any, kv: Dict[str, Any]) -> Any:
    """rich_text 배열 내부의 text.content 치환."""
    if not isinstance(rt_list, list) or not kv:
        return rt_list
    new_rt = []
    for item in rt_list:
        if isinstance(item, dict) and item.get("type") == "text":
            txt = item.get("text", {})
            if isinstance(txt, dict):
                txt["content"] = _replace_in_text(txt.get("content", ""), kv)
                item = dict(item)
                item["text"] = txt
        new_rt.append(item)
    return new_rt


def replace_placeholders_in_blocks(blocks: List[dict], kv: Dict[str, Any]) -> List[dict]:
    """
    Notion 블록 트리 전체를 순회하며 [키], {{키}}를 1:1로 치환한다.
    - 텍스트 계열: paragraph, headings, list_item, to_do, toggle, quote, callout, code, template.rich_text
    - media caption: image, video, file, pdf, audio, bookmark, embed
    - table_row.cells: [[rich_text...], ...]
    - 컨테이너 children: column_list/column, synced_block, template, table
    """
    if not isinstance(blocks, list) or not kv:
        return blocks

    TEXT_TYPES_WITH_RICH_TEXT = {
        "paragraph", "heading_1", "heading_2", "heading_3",
        "bulleted_list_item", "numbered_list_item",
        "to_do", "toggle", "quote", "callout", "code", "template"
    }
    MEDIA_TYPES_WITH_CAPTION = {
        "image", "video", "file", "pdf", "audio", "bookmark", "embed"
    }

    def walk(b: Any) -> Any:
        if not isinstance(b, dict):
            return b
        t = b.get("type")
        payload = isinstance(t, str) and b.get(t)
        if not isinstance(payload, dict):
            # column_list/column처럼 payload가 아닌 상위키 children 구조면 아래에서 처리
            pass
        nb = dict(b)

        # 1) 텍스트 계열: payload.rich_text 치환
        if isinstance(payload, dict) and t in TEXT_TYPES_WITH_RICH_TEXT:
            payload = dict(payload)
            if "rich_text" in payload:
                payload["rich_text"] = _replace_in_rich_text_list(payload.get("rich_text"), kv)
            # template은 children도 가짐
            if t == "template" and isinstance(payload.get("children"), list):
                payload["children"] = [walk(ch) for ch in payload["children"]]
            nb[t] = payload

        # 2) table_row: cells 치환
        if t == "table_row" and isinstance(payload, dict):
            payload = dict(payload)
            cells = payload.get("cells")
            if isinstance(cells, list):
                new_cells = []
                for cell in cells:
                    if isinstance(cell, list):
                        new_cell = _replace_in_rich_text_list(cell, kv)
                        new_cells.append(new_cell)
                    else:
                        new_cells.append(cell)
                payload["cells"] = new_cells
            nb[t] = payload

        # 3) MEDIA caption / equation.expression
        if isinstance(payload, dict) and t in MEDIA_TYPES_WITH_CAPTION:
            payload = dict(payload)
            if "caption" in payload and isinstance(payload["caption"], list):
                payload["caption"] = _replace_in_rich_text_list(payload["caption"], kv)
            nb[t] = payload
        if t == "equation" and isinstance(payload, dict):
            payload = dict(payload)
            if "expression" in payload:
                payload["expression"] = _replace_in_text(payload["expression"], kv)
            nb[t] = payload

        # 4) 컨테이너 children: column_list, column, synced_block, table
        if t == "column_list" and isinstance(payload, dict):
            payload = dict(payload)
            if isinstance(payload.get("children"), list):
                payload["children"] = [walk(ch) for ch in payload["children"]]
            nb[t] = payload

        if t == "column" and isinstance(payload, dict):
            payload = dict(payload)
            if isinstance(payload.get("children"), list):
                payload["children"] = [walk(ch) for ch in payload["children"]]
            nb[t] = payload

        if t == "synced_block" and isinstance(payload, dict):
            payload = dict(payload)
            if isinstance(payload.get("children"), list):
                payload["children"] = [walk(ch) for ch in payload["children"]]
            nb[t] = payload

        if t == "table" and isinstance(payload, dict):
            payload = dict(payload)
            if isinstance(payload.get("children"), list):
                payload["children"] = [walk(ch) for ch in payload["children"]]
            nb[t] = payload

        # 5) 혹시 payload가 없거나 위에서 캐치 못한 텍스트 계열 보정(드문 케이스)
        if isinstance(payload, dict) and t not in TEXT_TYPES_WITH_RICH_TEXT:
            # 일부 블록이 특수 필드에 rich_text를 둘 수 있으므로 caption만 한 번 더 방어
            if "caption" in payload and isinstance(payload["caption"], list):
                payload = dict(payload)
                payload["caption"] = _replace_in_rich_text_list(payload["caption"], kv)
                nb[t] = payload

        return nb

    return [walk(b) for b in blocks]




# ──────────────────────────────────────────────────────────────────────────────
# 블록 변환
# ──────────────────────────────────────────────────────────────────────────────
def _transform_block_for_create(block: Dict[str, Any]) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
    b = _strip_readonly_keys(block.copy())

    extracted_children = b.pop("children", None)
    typ = b.get("type")
    container_types = {"column_list","column","template","synced_block","table"}

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

    # 미디어류
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

    # 컬럼/템플릿/싱크 컨테이너
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

    # ✅ 테이블 컨테이너: children 은 table_row
    if typ == "table":
        payload = b.get("table", {}) or {}
        table_children = payload.get("children")
        source_children = table_children if isinstance(table_children, list) else extracted_children
        norm_children: List[Dict[str, Any]] = []
        if source_children:
            for ch in source_children:
                ch_norm = _transform_block_for_create(ch)
                if isinstance(ch_norm, list): norm_children.extend(ch_norm)
                else: norm_children.append(ch_norm)
        # table 필수 키들(없으면 기본치)
        tw = payload.get("table_width")
        hch = payload.get("has_column_header")
        hrh = payload.get("has_row_header")
        b["table"] = {
            "table_width": int(tw) if isinstance(tw, int) else max(1, int(payload.get("table_width", 1))),
            "has_column_header": bool(hch) if isinstance(hch, bool) else bool(payload.get("has_column_header", False)),
            "has_row_header": bool(hrh) if isinstance(hrh, bool) else bool(payload.get("has_row_header", False)),
            "children": norm_children,
        }
        return b

    # ✅ 테이블 행: cells 안 rich_text 정규화
    if typ == "table_row":
        payload = b.get("table_row", {}) or {}
        cells = payload.get("cells")
        norm_cells: List[List[Dict[str, Any]]] = []
        if isinstance(cells, list):
            for cell in cells:
                norm_cells.append(_transform_rich_text(cell))
        b["table_row"] = {"cells": norm_cells}
        b.pop("children", None)  # table_row 는 children 없음
        return b

    # 블릿 리스트 평탄화
    if typ in ("bulleted_list","numbered_list"):
        source_children = extracted_children or []
        flattened: List[Dict[str, Any]] = []
        for ch in source_children:
            ch_norm = _transform_block_for_create(ch)
            if isinstance(ch_norm, list): flattened.extend(ch_norm)
            else: flattened.append(ch_norm)
        return flattened

    # 일반 children 평탄화
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

        # 컨테이너들: children 재귀 소독
        if b_type == "column_list":
            if "children" in nb and isinstance(nb["children"], list):
                nb["children"] = _sanitize_blocks_for_create(nb["children"])
        elif b_type == "column":
            col = nb.get("column", {})
            if isinstance(col, dict) and isinstance(col.get("children"), list):
                col["children"] = _sanitize_blocks_for_create(col["children"])
                nb["column"] = col
        elif b_type == "template":
            tpl = nb.get("template", {})
            if isinstance(tpl, dict) and isinstance(tpl.get("children"), list):
                tpl["children"] = _sanitize_blocks_for_create(tpl["children"])
                nb["template"] = tpl
        elif b_type == "synced_block":
            sb = nb.get("synced_block", {})
            if isinstance(sb, dict) and isinstance(sb.get("children"), list):
                sb["children"] = _sanitize_blocks_for_create(sb["children"])
                nb["synced_block"] = sb
        elif b_type == "table":
            tb = nb.get("table", {})
            if isinstance(tb, dict) and isinstance(tb.get("children"), list):
                tb["children"] = _sanitize_blocks_for_create(tb["children"])
                nb["table"] = tb
        # table_row 는 children 없음 (cells 는 변환 단계에서 정규화 완료)

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

    # 4) 2차 소독 + 검증
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
