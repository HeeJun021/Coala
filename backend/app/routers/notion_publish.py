# app/routers/notion_publish.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.models.user import User
from app.models.template import NotionTemplate, NotionExportHistory
from app.dependencies.auth import get_current_user
from app.services.notion_ai_service import render_with_ai
# ▼ 변경: create_page_then_append import
from app.services.notion_api_service import create_page_then_append  # <- 여기

router = APIRouter(prefix="/notion", tags=["Notion Publish"])


class PublishBody(BaseModel):
    template_id: int = Field(..., description="선택된 템플릿 ID")
    target_page_id: str = Field(..., description="사용자가 공유한 페이지 ID")
    title: str = Field(..., description="생성될 페이지 제목")


@router.post("/publish")
def publish_to_notion(
    body: PublishBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    1. 템플릿 로드
    2. 사용자 데이터 + GPT-5 가공
    3. Notion API 호출 (새 하위 페이지 생성 → blocks append)
    4. 내보내기 이력 기록
    """
    tpl = db.query(NotionTemplate).filter(NotionTemplate.id == body.template_id).first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")

    # (1) 사용자 데이터 수집 (샘플)
    kv: Dict[str, Any] = {
        "name": current_user.nickname or current_user.email,
        "rating": current_user.rating,
        "tier": current_user.tier_id,
    }

    # (2) GPT-5 가공 (placeholder 치환 등)
    processed_blocks = render_with_ai(tpl.doc_json, kv)

    # (3) 하위 페이지 생성 후 블록 붙여넣기
    created_page_id = create_page_then_append(
        current_user,
        body.target_page_id,
        body.title,
        processed_blocks,
    )

    # (4) 이력 저장
    hist = NotionExportHistory(
        user_id=current_user.user_id,
        template_id=tpl.id,
        target_page_id=body.target_page_id,
        created_page_id=created_page_id,
    )
    db.add(hist)
    db.commit()

    return {"ok": True, "created_page_id": created_page_id}

