# backend/app/services/notion_export_service.py
import os
import re
import copy
import requests
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from cryptography.fernet import Fernet

from app.models.user import User

NOTION_API = "https://api.notion.com/v1"
NOTION_VER = "2022-06-28"  # 고정 버전 사용 권장
FERNET = Fernet(os.getenv("FERNET_SECRET").encode())

# ---------------------------
# 유틸
# ---------------------------
NOTION_ID_REGEX = re.compile(r"([0-9a-f]{32})", re.IGNORECASE)

def parse_notion_id(url_or_id: str) -> str:
    """
    노션 URL 또는 순수 ID(하이픈 포함/미포함)에서 32자리 hex 추출.
    """
    if not url_or_id:
        raise ValueError("Notion URL/ID가 비어있습니다.")
    cleaned = url_or_id.replace("-", "")
    m = NOTION_ID_REGEX.search(cleaned)
    if not m:
        raise ValueError("유효한 Notion ID를 찾지 못했습니다.")
    return m.group(1)

def _get_token(user: User) -> str:
    if not user or not user.notion_token:
        raise PermissionError("Notion이 연결되어 있지 않습니다.")
    return FERNET.decrypt(user.notion_token.encode()).decode()

def _headers(token: str) -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Notion-Version": NOTION_VER,
        "Content-Type": "application/json",
    }

# ---------------------------
# 블록 읽기/치환
# ---------------------------
def _fetch_children(token: str, block_id: str) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    next_cursor = None
    while True:
        params = {}
        if next_cursor:
            params["start_cursor"] = next_cursor
        r = requests.get(
            f"{NOTION_API}/blocks/{block_id}/children",
            headers=_headers(token),
            params=params,
            timeout=20,
        )
        r.raise_for_status()
        data = r.json()
        for b in data.get("results", []):
            if b.get("has_children"):
                b["children"] = _fetch_children(token, b["id"])
            results.append(b)
        if not data.get("has_more"):
            break
        next_cursor = data.get("next_cursor")
    return results

def _replace_placeholders(blocks: List[Dict[str, Any]], kv: Dict[str, Any]) -> List[Dict[str, Any]]:
    def render_text(s: str) -> str:
        out = s
        for k, v in kv.items():
            out = out.replace(f"{{{{{k}}}}}", str(v))
        return out

    def walk(b: Dict[str, Any]) -> Dict[str, Any]:
        b = copy.deepcopy(b)
        # 텍스트가 들어갈 수 있는 common 위치들 처리
        t = b.get("type")
        if t and t in b:
            obj = b[t]
            # title
            if "title" in obj and isinstance(obj["title"], list):
                for span in obj["title"]:
                    if "text" in span and "content" in span["text"]:
                        span["text"]["content"] = render_text(span["text"]["content"])
                    if "plain_text" in span:
                        span["plain_text"] = render_text(span["plain_text"])
            # rich_text
            if "rich_text" in obj and isinstance(obj["rich_text"], list):
                for span in obj["rich_text"]:
                    if "text" in span and "content" in span["text"]:
                        span["text"]["content"] = render_text(span["text"]["content"])
                    if "plain_text" in span:
                        span["plain_text"] = render_text(span["plain_text"])
        # children 재귀
        if "children" in b and isinstance(b["children"], list):
            b["children"] = [walk(c) for c in b["children"]]
        return b
    return [walk(x) for x in blocks]

def _strip_for_create(b: Dict[str, Any]) -> Dict[str, Any]:
    """
    업로드용 최소 형태로 정리:
    {object:'block', type:'paragraph', paragraph:{ ... }, children:[...]}
    """
    t = b["type"]
    base = {"object": "block", "type": t, t: b[t]}
    if "children" in b and b["children"]:
        base["children"] = [_strip_for_create(c) for c in b["children"]]
    # 업로드 불가 필드 제거 예시
    for k in ["id", "created_time", "last_edited_time", "archived", "has_children"]:
        base.get(t, {}).pop(k, None)
        base.pop(k, None)
    return base

# ---------------------------
# 메인: 템플릿 -> 새 페이지 생성
# ---------------------------
def create_portfolio_page(
    db: Session,
    user_id: int,
    *,
    template_url_or_id: str,
    parent_url_or_id: Optional[str],
    parent_database_url_or_id: Optional[str],
    title: str,
    kv: Dict[str, Any],
) -> Dict[str, Any]:
    user: User = db.query(User).filter(User.user_id == user_id).first()
    token = _get_token(user)

    template_id = parse_notion_id(template_url_or_id)
    parent_page_id = parse_notion_id(parent_url_or_id) if parent_url_or_id else None
    parent_db_id = parse_notion_id(parent_database_url_or_id) if parent_database_url_or_id else None

    # 1) 템플릿 블록 수집 + 치환
    template_blocks = _fetch_children(token, template_id)
    replaced = _replace_placeholders(template_blocks, kv)
    upload_blocks = [_strip_for_create(b) for b in replaced]

    # 2) 새 페이지 생성(부모 DB 우선 → 없다면 부모 페이지)
    if parent_db_id:
        body = {
            "parent": {"database_id": parent_db_id},
            "properties": {
                "Name": {"title": [{"text": {"content": title}}]}
            }
        }
    else:
        parent = {"page_id": parent_page_id} if parent_page_id else None
        # 페이지 아래 페이지 생성 시 title 속성 사용
        body = {
            "parent": parent,
            "properties": {
                "title": [{"text": {"content": title}}]
            }
        }

    r = requests.post(f"{NOTION_API}/pages", headers=_headers(token), json=body, timeout=30)
    if r.status_code >= 400:
        raise RuntimeError(f"Notion 페이지 생성 실패: {r.text}")
    page = r.json()
    new_page_id = page["id"]

    # 3) 블록 붙이기(청크 업로드)
    CHUNK = 90
    for i in range(0, len(upload_blocks), CHUNK):
        chunk = upload_blocks[i:i+CHUNK]
        rr = requests.patch(
            f"{NOTION_API}/blocks/{new_page_id}/children",
            headers=_headers(token),
            json={"children": chunk},
            timeout=30,
        )
        if rr.status_code >= 400:
            raise RuntimeError(f"Notion 블록 추가 실패: {rr.text}")

    return {"page_id": new_page_id, "url": page.get("url")}
