# backend/app/services/notion_ingest.py
from __future__ import annotations
from typing import List, Dict, Any, Optional
from app.models.template import NotionTemplate

# ⚠️ 실제 프로젝트의 Notion SDK 접근 헬퍼를 import 하세요.
# 예: from app.services.notion_client import get_internal_notion

def fetch_all_children(notion, block_id: str, page_size: int = 100) -> List[Dict[str, Any]]:
    """
    주어진 block_id의 '직계 자식'을 페이지네이션으로 모두 가져오고,
    각 블록이 has_children=True면 재귀적으로 children을 채워서 반환.
    - 스타일/레이아웃 필드는 그대로 유지(정규화/삭제하지 않음).
    """
    results: List[Dict[str, Any]] = []
    start_cursor: Optional[str] = None

    while True:
        payload: Dict[str, Any] = {"block_id": block_id, "page_size": page_size}
        if start_cursor:
            payload["start_cursor"] = start_cursor

        resp = notion.blocks.children.list(**payload)
        blocks: List[Dict[str, Any]] = resp.get("results", []) or []
        for b in blocks:
            # 깊은 children 수집
            if b.get("has_children"):
                child_id = b.get("id")
                # Notion은 UUID with hyphen. 저장 시 하이픈 제거 여부는 정책에 따르세요.
                if child_id:
                    b["children"] = fetch_all_children(notion, child_id, page_size=page_size)
            results.append(b)

        if not resp.get("has_more"):
            break
        start_cursor = resp.get("next_cursor")

    return results


def get_page_title(notion, page_id: str) -> str:
    """
    pages.retrieve(page_id) 호출로 원본 페이지 제목을 얻어 plain text로 합쳐 반환.
    - title 타입 property만 대상으로 함.
    - 여러 리치텍스트 조각이 있을 수 있으므로 모두 합침.
    """
    page = notion.pages.retrieve(page_id=page_id)
    props = page.get("properties", {}) or {}

    # 1) 'title' 타입 속성 탐색
    for _, prop in props.items():
        if prop and prop.get("type") == "title":
            title_arr = prop.get("title", []) or []
            texts: List[str] = []
            for t in title_arr:
                # Notion rich_text: {plain_text, text:{content}, ...}
                plain = t.get("plain_text")
                if isinstance(plain, str):
                    texts.append(plain)
                else:
                    # fallback
                    content = (t.get("text") or {}).get("content")
                    if isinstance(content, str):
                        texts.append(content)
            return "".join(texts).strip()

    # 2) fallback: 빈 문자열
    return ""

def build_preview_url(page_id: str) -> str:
    """
    Notion 공개 페이지 기본 URL 생성
    - Notion에서 '웹에 공유' 옵션을 켜야 외부 접근 가능
    """
    clean_id = page_id.replace("-", "")
    return f"https://www.notion.so/{clean_id}"