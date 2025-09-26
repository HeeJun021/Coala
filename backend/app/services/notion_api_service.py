import os
import json
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

# ✅ Notion에서 children을 가질 수 있는(계층화 가능한) 블록들
# (실제 Notion API 문서 기준으로 children 허용되는 주요 텍스트 계열 포함)
_BLOCKS_ALLOW_CHILDREN = {
    "callout",
    "paragraph",
    "heading_1","heading_2","heading_3",
    "bulleted_list_item","numbered_list_item",
    "to_do","toggle","quote","code",
    "template","synced_block","column_list","column","table",  # 기존 컨테이너 포함
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
        if "text" in rt and isinstance(rt["text"], dict):
            item: Dict[str, Any] = {"type": "text", "text": rt["text"]}
            if "annotations" in rt:
                item["annotations"] = rt["annotations"]
            if "href" in rt:
                item["href"] = rt["href"]
            out.append(item)
        elif isinstance(rt.get("plain_text"), str):
            item = {"type": "text", "text": {"content": rt["plain_text"]}}
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
    token = _decrypt(user.notion_token)
    headers = _headers(token)
    url = f"{NOTION_API_BASE}/pages/{page_id}"

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
# 치환 유틸
# ──────────────────────────────────────────────────────────────────────────────
def _replace_in_text(text: Any, kv: Dict[str, Any]) -> Any:
    if not isinstance(text, str) or not kv:
        return text
    out = text
    for k, v in kv.items():
        if v is None:
            continue
        val = str(v)
        out = out.replace(f"[{k}]", val)
        out = out.replace(f"{{{{{k}}}}}", val)
    return out

def _replace_in_rich_text_list(rt_list: Any, kv: Dict[str, Any]) -> Any:
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
    - [키] 형태의 placeholder를 kv로 치환
      * kv[key]가 list면 → bulleted_list_item 여러 블록으로 치환
      * kv[key]가 str이면 → 해당 블록의 rich_text를 문자열로 대체
      * kv[key]가 빈 문자열이면 → 해당 블록 제거
      * [닉네임] [역할] → kv["프로젝트역할"] 리스트를 불릿 리스트로 치환
    - walk()는 항상 dict만 반환 (여러 블록 치환은 {"__replace_with_list__": [...]}로 표시)
    - flatten()에서만 리스트를 실제 블록 배열로 전개
    """
    if not isinstance(blocks, list) or not kv:
        return blocks

    TEXT_TYPES_WITH_RICH_TEXT = {
        "paragraph", "heading_1", "heading_2", "heading_3",
        "bulleted_list_item", "numbered_list_item",
        "to_do", "toggle", "quote", "callout", "code", "template"
    }
    MEDIA_TYPES_WITH_CAPTION = {"image", "video", "file", "pdf", "audio", "bookmark", "embed"}

    def make_bullet(content: str, color: str = "default") -> dict:
        return {
            "object": "block",
            "type": "bulleted_list_item",
            "bulleted_list_item": {
                "rich_text": [
                    {
                        "type": "text",
                        "text": {"content": content},
                        "annotations": {
                            "bold": False,
                            "italic": False,
                            "strikethrough": False,
                            "underline": False,
                            "code": False,
                            "color": color,
                        },
                    }
                ],
                "color": "default",
            },
        }

    def walk(b: Any) -> Any:
        if not isinstance(b, dict):
            return b

        t = b.get("type")
        payload = isinstance(t, str) and b.get(t)
        nb = dict(b)

        if isinstance(payload, dict) and t in TEXT_TYPES_WITH_RICH_TEXT:
            payload = dict(payload)
            if "rich_text" in payload:
                rich_list = payload.get("rich_text", [])
                text_str = "".join([frag.get("plain_text", "") for frag in rich_list]).strip()

                # --- 프로젝트 역할: Callout 안의 [닉네임]을 전체 Callout 리스트로 치환 ---
                if t == "callout" and text_str == "[닉네임]":
                    import logging, json, re, ast

                    def _parse_member(m):
                        """
                        m 이 dict면 {닉네임, 역할} 처리
                        m 이 str면 '닉네임 ([...])' 형태 파싱해 (nickname, roles_list) 반환
                        """
                        if isinstance(m, dict):
                            nickname = str(
                                m.get("닉네임") or m.get("nickname") or m.get("name") or ""
                            ).strip()
                            role_val = m.get("역할") or m.get("role") or ""
                            # 역할이 리스트/문자열 모두 허용
                            if isinstance(role_val, list):
                                roles = [str(r).strip() for r in role_val if str(r).strip()]
                            elif isinstance(role_val, str):
                                roles = [r.strip() for r in role_val.split(",") if r.strip()]
                            else:
                                roles = []
                            return nickname, roles

                        if isinstance(m, str):
                            s = m.strip()
                            # 형태: 닉네임 ([...])
                            # 괄호 안은 파이썬 리스트 문자열이라 ast.literal_eval로 안전 파싱
                            mobj = re.match(r"^(?P<nick>.+?)\s*\((?P<roles>\[.*\])\)\s*$", s)
                            if mobj:
                                nick = mobj.group("nick").strip()
                                roles_raw = mobj.group("roles")
                                roles = []
                                try:
                                    parsed = ast.literal_eval(roles_raw)
                                    if isinstance(parsed, list):
                                        roles = [str(r).strip() for r in parsed if str(r).strip()]
                                    else:
                                        roles = [str(parsed).strip()]
                                except Exception:
                                    # 파싱 실패 시 괄호 내용 제거하고 원문 보존
                                    roles = [roles_raw]
                                return nick, roles
                            else:
                                # 괄호가 없으면 전부 닉네임으로 취급
                                return s, []
                        # 알 수 없는 타입
                        return "", []

                    members = kv.get("프로젝트역할") or kv.get("프로젝트 역할")
                    logging.info("[ROLE] nickname placeholder detected in callout. members=%s",
                                json.dumps(members, ensure_ascii=False) if isinstance(members, list) else str(type(members)))

                    if isinstance(members, list) and members:
                        new_blocks = []
                        for m in members:
                            nickname, roles = _parse_member(m)

                            if not (nickname or roles):
                                continue

                            callout_block = {
                                "object": "block",
                                "type": "callout",
                                "callout": {
                                    "rich_text": [
                                        {
                                            "type": "text",
                                            "text": {"content": nickname or "(이름 미상)"},
                                            "annotations": {
                                                "bold": True,
                                                "italic": False,
                                                "strikethrough": False,
                                                "underline": False,
                                                "code": False,
                                                "color": "default",
                                            },
                                        }
                                    ],
                                    "icon": {"type": "external", "external": {"url": "https://www.notion.so/icons/user_green.svg"}},
                                    "color": payload.get("color", "gray_background"),
                                },
                                "children": []
                            }

                            role_text = "역할 : " + (", ".join(roles) if roles else "-")
                            callout_block["children"].append({
                                "object": "block",
                                "type": "paragraph",
                                "paragraph": {
                                    "rich_text": [
                                        {
                                            "type": "text",
                                            "text": {"content": role_text},
                                            "annotations": {
                                                "bold": False,
                                                "italic": False,
                                                "strikethrough": False,
                                                "underline": False,
                                                "code": False,
                                                "color": "default",  # 요청: 주황색 텍스트
                                            },
                                        }
                                    ],
                                    "color": "default",
                                },
                            })

                            new_blocks.append(callout_block)

                        logging.info("[ROLE] replacing callout with %d member callouts", len(new_blocks))
                        return {"__replace_with_list__": new_blocks}
                    else:
                        logging.warning("[ROLE] members missing or not a list. kv keys=%s",
                                        list(kv.keys()) if isinstance(kv, dict) else type(kv))


                # ✅ 일반 [키]
                if text_str.startswith("[") and text_str.endswith("]"):
                    key = text_str.strip("[]")
                    value = kv.get(key)

                    if isinstance(value, list):
                        return {"__replace_with_list__": [make_bullet(str(v), "orange") for v in value]}

                    elif isinstance(value, str):
                        if not value.strip():
                            return {"__replace_with_list__": []}
                        payload["rich_text"] = [{"type": "text", "text": {"content": value}}]
                        nb[t] = payload
                        return nb

                # ✅ rich_text 내부 치환
                payload["rich_text"] = _replace_in_rich_text_list(rich_list, kv)

            if t in _BLOCKS_ALLOW_CHILDREN and isinstance(payload.get("children"), list):
                payload["children"] = [walk(ch) for ch in payload["children"]]
            nb[t] = payload

        # table_row
        if t == "table_row" and isinstance(payload, dict):
            payload = dict(payload)
            if isinstance(payload.get("cells"), list):
                payload["cells"] = [
                    _replace_in_rich_text_list(cell, kv) if isinstance(cell, list) else cell
                    for cell in payload["cells"]
                ]
            nb[t] = payload

        # caption / equation
        if isinstance(payload, dict) and t in MEDIA_TYPES_WITH_CAPTION:
            payload = dict(payload)
            if isinstance(payload.get("caption"), list):
                payload["caption"] = _replace_in_rich_text_list(payload["caption"], kv)
            nb[t] = payload

        if t == "equation" and isinstance(payload, dict):
            payload = dict(payload)
            if "expression" in payload:
                payload["expression"] = _replace_in_text(payload["expression"], kv)
            nb[t] = payload

        # 컨테이너
        if t in {"column_list", "column", "synced_block", "table", "template"} and isinstance(payload, dict):
            payload = dict(payload)
            if isinstance(payload.get("children"), list):
                payload["children"] = [walk(ch) for ch in payload["children"]]
            nb[t] = payload

        if isinstance(nb.get("children"), list):
            nb["children"] = [walk(ch) for ch in nb["children"]]

        return nb

    def _flatten(blocks):
        out = []
        for b in blocks:
            if isinstance(b, list):
                out.extend(_flatten(b))
            elif isinstance(b, dict) and "__replace_with_list__" in b:
                out.extend(_flatten(b["__replace_with_list__"]))
            else:
                out.append(b)
        return out

    walked = [walk(b) for b in blocks]
    flattened = _flatten(walked)

    import logging, json
    logging.info("[DEBUG] After flatten: %s", json.dumps(flattened[:5], ensure_ascii=False))

    return flattened


def _flatten_blocks(blocks):
    """중첩 list 또는 __replace_with_list__를 전부 재귀적으로 flatten"""
    out = []
    for b in blocks:
        if isinstance(b, list):
            out.extend(_flatten_blocks(b))
        elif isinstance(b, dict) and "__replace_with_list__" in b:
            out.extend(_flatten_blocks(b["__replace_with_list__"]))
        elif isinstance(b, dict):
            # children까지 재귀 flatten
            nb = dict(b)
            if isinstance(nb.get("children"), list):
                nb["children"] = _flatten_blocks(nb["children"])
            out.append(nb)
        else:
            out.append(b)
    return out




# ──────────────────────────────────────────────────────────────────────────────
# 블록 변환
# ──────────────────────────────────────────────────────────────────────────────
def _transform_block_for_create(block: Dict[str, Any]) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
    b = _strip_readonly_keys(block.copy())

    extracted_children = b.pop("children", None)
    typ = b.get("type")
    container_types = {"column_list","column","template","synced_block","table"}

    def _fix_rich_text_in(payload_key: str):
        payload = b.get(payload_key, {}) or {}
        if "rich_text" in payload:
            payload["rich_text"] = _transform_rich_text(payload["rich_text"])
        b[payload_key] = payload

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

    # 텍스트 계열 정규화
    if typ in ("paragraph","heading_1","heading_2","heading_3","callout",
               "bulleted_list_item","numbered_list_item","to_do","toggle","quote","code"):
        _fix_rich_text_in(typ)

    # ✅ 텍스트 계열(및 child-bearing 블록)의 children 유지/변환
    if typ in _BLOCKS_ALLOW_CHILDREN and typ not in {"column_list","column","template","synced_block","table"}:
        payload = b.get(typ, {}) or {}
        inner_children = payload.get("children")
        source_children = inner_children if isinstance(inner_children, list) else extracted_children
        norm_children: List[Dict[str, Any]] = []
        if source_children:
            for ch in source_children:
                ch_norm = _transform_block_for_create(ch)
                if isinstance(ch_norm, list): norm_children.extend(ch_norm)
                else: norm_children.append(ch_norm)
        if norm_children:
            payload["children"] = norm_children
            b[typ] = payload
        # 텍스트 계열은 여기서 계속 진행(미디어/컨테이너 분기와 충돌 없음)

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

    # 테이블 컨테이너
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

    # 테이블 행
    if typ == "table_row":
        payload = b.get("table_row", {}) or {}
        cells = payload.get("cells")
        norm_cells: List[List[Dict[str, Any]]] = []
        if isinstance(cells, list):
            for cell in cells:
                norm_cells.append(_transform_rich_text(cell))
        b["table_row"] = {"cells": norm_cells}
        b.pop("children", None)
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

    # 일반 children (텍스트 계열에서 이미 붙였기 때문에 여기선 평탄화하지 않음)
    flat_children: List[Dict[str, Any]] = []
    if extracted_children:
        # 텍스트 계열 외에 남아있는 특수 케이스를 대비
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
        if not isinstance(b, dict): 
            continue
        b_type = b.get("type")
        if not b_type: 
            continue
        payload = b.get(b_type)
        if not isinstance(payload, dict): 
            continue

        nb = {k:v for k,v in b.items() if k not in READONLY_KEYS}
        nb[b_type] = dict(payload)

        # ✅ children을 가질 수 있는 모든 타입에 대해 재귀 소독
        if b_type in _BLOCKS_ALLOW_CHILDREN:
            pl = nb.get(b_type, {})
            if isinstance(pl, dict) and isinstance(pl.get("children"), list):
                pl["children"] = _sanitize_blocks_for_create(pl["children"])
                nb[b_type] = pl

        # table은 위에서 처리되지만 안전망으로 한 번 더
        if b_type == "table":
            tb = nb.get("table", {})
            if isinstance(tb, dict) and isinstance(tb.get("children"), list):
                tb["children"] = _sanitize_blocks_for_create(tb["children"])
                nb["table"] = tb
        # table_row는 children 없음

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
