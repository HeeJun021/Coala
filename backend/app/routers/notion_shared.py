# app/routers/notion_shared.py
import os, requests
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from cryptography.fernet import Fernet

from app.database import get_db
from app.models.user import User
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/notion/shared", tags=["Notion Shared"])

FERNET = Fernet(os.getenv("FERNET_SECRET").encode())
NOTION_API_BASE = "https://api.notion.com/v1"
NOTION_VERSION = os.getenv("NOTION_API_VERSION", "2025-09-03")


def _decrypt(token_enc: str) -> str:
    return FERNET.decrypt(token_enc.encode()).decode()


def _headers(token: str) -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }


def _format_page(obj: dict) -> dict:
    icon = obj.get("icon")
    emoji = icon.get("emoji") if icon and icon.get("type") == "emoji" else None
    icon_url = icon.get("external", {}).get("url") if icon and icon.get("type") == "external" else None
    title = None
    props = obj.get("properties")
    if props:
        for _, v in props.items():
            if v.get("type") == "title":
                title = "".join([t.get("plain_text", "") for t in v.get("title", [])])
                break
    return {
        "id": obj.get("id"),
        "title": title or "제목 없는 페이지",
        "emoji": emoji,
        "icon_url": icon_url,
        "url": obj.get("url"),
    }


@router.get("/pages")
def list_shared_pages(
    q: Optional[str] = Query(None, description="검색어"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    사용자가 Integration과 공유한 페이지 목록 조회
    """
    if not current_user or not current_user.notion_token:
        raise HTTPException(status_code=401, detail="Notion is not connected")

    token = _decrypt(current_user.notion_token)
    payload = {"page_size": 30, "filter": {"value": "page", "property": "object"}}
    if q:
        payload["query"] = q

    r = requests.post(f"{NOTION_API_BASE}/search", headers=_headers(token), json=payload, timeout=20)
    if r.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Notion search failed: {r.text}")

    items = [_format_page(obj) for obj in r.json().get("results", []) if obj.get("object") == "page"]
    return {"items": items}
