# app/routers/notion_templates.py (추가/교체)
import os, requests
from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from cryptography.fernet import Fernet

from app.database import get_db
from app.models.user import User
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/notion", tags=["Notion"])

FERNET = Fernet(os.getenv("FERNET_SECRET").encode())
NOTION_API_BASE = "https://api.notion.com/v1"
NOTION_VERSION = os.getenv("NOTION_VERSION", "2022-06-28")

def _decrypt(token_enc: str) -> str:
    return FERNET.decrypt(token_enc.encode()).decode()

def _headers(token: str) -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }

def _page_title_from_properties(props: dict) -> Optional[str]:
    for _, prop in (props or {}).items():
        if prop.get("type") == "title":
            rich = prop.get("title") or []
            return "".join([t.get("plain_text", "") for t in rich]) or None
    return None

def _format_page_item(page: dict) -> dict:
    icon = page.get("icon")
    emoji = icon.get("emoji") if icon and icon.get("type") == "emoji" else None
    icon_url = icon.get("external", {}).get("url") if icon and icon.get("type") == "external" else None
    return {
        "id": page.get("id"),
        "title": _page_title_from_properties(page.get("properties")) or "제목 없는 페이지",
        "emoji": emoji,
        "icon_url": icon_url,
        "url": page.get("url"),
    }

def _retrieve_page(token: str, page_id: str) -> dict:
    r = requests.get(f"{NOTION_API_BASE}/pages/{page_id}", headers=_headers(token), timeout=20)
    if r.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Notion retrieve page failed: {r.text}")
    return r.json()

def _list_child_pages_recursive(token: str, root_page_id: str, limit: int = 500) -> List[dict]:
    """
    root_page_id 하위의 child_page 들을 재귀적으로 수집
    - child_page 블록의 id == 자식 페이지 id (Notion API 특성)
    """
    items = []
    queue = [root_page_id]
    visited = set()

    while queue and len(items) < limit:
        current = queue.pop(0)
        if current in visited:
            continue
        visited.add(current)

        # children 나열
        next_cursor = None
        while True:
            params = {"page_size": 100}
            if next_cursor:
                params["start_cursor"] = next_cursor
            r = requests.get(
                f"{NOTION_API_BASE}/blocks/{current}/children",
                headers=_headers(token),
                params=params,
                timeout=20,
            )
            if r.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Notion children failed: {r.text}")
            data = r.json()
            for blk in data.get("results", []):
                t = blk.get("type")
                if t == "child_page":
                    child_page_id = blk.get("id")
                    # 페이지 메타 조회
                    page_obj = _retrieve_page(token, child_page_id)
                    items.append(_format_page_item(page_obj))
                    # 재귀적으로 더 내려감
                    queue.append(child_page_id)
                elif t == "child_database":
                    # 필요 시 DB 내부 페이지까지 포함하려면 여기서 query 추가 (비권장: 비용↑)
                    pass
            next_cursor = data.get("next_cursor")
            if not data.get("has_more"):
                break

        if len(items) >= limit:
            break

    # 중복 제거
    uniq = {}
    for it in items:
        uniq[it["id"]] = it
    return list(uniq.values())

@router.get("/templates")
def list_templates(
    q: Optional[str] = Query(default=None, description="검색어"),
    parent_page_id: Optional[str] = Query(default=None, description="이 페이지 하위만"),
    descendants: bool = Query(default=False, description="하위 전체 재귀 탐색"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user or not current_user.notion_token:
        raise HTTPException(status_code=401, detail="Notion is not connected.")
    token = _decrypt(current_user.notion_token)

    # 1) parent_page_id + descendants → 재귀 수집
    if parent_page_id and descendants:
        items = _list_child_pages_recursive(token, parent_page_id, limit=800)
        # 선택적: q 필터 적용
        if q:
            q_low = q.lower()
            items = [it for it in items if q_low in (it["title"] or "").lower()]
        return {"items": items}

    # 2) parent_page_id만 있고 descendants=False → 해당 페이지의 직속 child_page만
    if parent_page_id:
        # 직속 children만 한 번 훑기
        results = _list_child_pages_recursive(token, parent_page_id, limit=100)
        return {"items": results}

    # 3) 기본: /search 로 통합앱 접근 가능한 페이지 검색
    payload = {"page_size": 50, "filter": {"property": "object", "value": "page"}}
    if q:
        payload["query"] = q
    r = requests.post(f"{NOTION_API_BASE}/search", headers=_headers(token), json=payload, timeout=20)
    if r.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Notion search failed: {r.text}")

    items = []
    for obj in r.json().get("results", []):
        if obj.get("object") != "page":
            continue
        items.append(_format_page_item(obj))
    return {"items": items}