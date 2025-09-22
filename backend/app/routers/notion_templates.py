# backend/app/routers/notion_templates.py
from __future__ import annotations

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.template import NotionTemplate
from app.models.user import User
from app.dependencies.auth import get_current_user

# 🔗 내부용 Notion 클라이언트 팩토리
from app.services.notion_internal import get_internal_notion
from app.services.notion_ingest import fetch_all_children, get_page_title, build_preview_url

router = APIRouter(prefix="/templates", tags=["Templates"])


# ====== 요청 바디 ======
class IngestBody(BaseModel):
    page_id: str = Field(..., description="공유된 Notion 페이지 ID(32 hex 또는 UUID)")
    key: str = Field(..., description="템플릿 식별 키(동일 키 재인제스트 시 version++)")
    title: Optional[str] = Field(None, description="(옵션) 클라이언트 전달 제목(원본으로 덮어씀)")
    description: Optional[str] = Field(None, description="설명")


# ====== 인제스트 엔드포인트 ======
@router.post("/ingest")
def ingest_template(
    body: IngestBody,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
):
    """
    - pages.retrieve(page_id) 로 '원본 페이지 제목'을 얻어 NotionTemplate.title 에 저장
    - blocks.children.list(재귀) 로 전체 블록 트리를 수집하여 doc_json 에 저장
    - 동일 key 가 존재하면 version++ 하여 갱신, 없으면 신규 생성
    """
    notion = get_internal_notion()

    # 1) 원본 페이지 제목 조회
    original_title = get_page_title(notion, body.page_id) or ""

    # 2) 블록 트리 스냅샷 수집
    doc_json: List[Dict[str, Any]] = fetch_all_children(notion, body.page_id)

    # 3) 키 중복 검사
    tpl: NotionTemplate | None = (
        db.query(NotionTemplate).filter(NotionTemplate.key == body.key).first()
    )

    if tpl is None:
        # 신규 생성
        tpl = NotionTemplate(
            key=body.key,
            version=1,
            title=original_title or (body.title or ""),
            description=body.description or "",
            doc_json=doc_json,
            page_id=body.page_id,   # ✅ page_id 저장
            preview_url=build_preview_url(body.page_id),
        )
        db.add(tpl)
        db.commit()
        db.refresh(tpl)
    else:
        # 기존 템플릿 갱신
        tpl.version = (tpl.version or 0) + 1
        tpl.title = original_title or (body.title or "")
        if body.description is not None:
            tpl.description = body.description
        tpl.doc_json = doc_json
        tpl.page_id = body.page_id
        tpl.preview_url = build_preview_url(body.page_id)
        db.commit()

    return {
        "ok": True,
        "template_id": tpl.id,
        "key": tpl.key,
        "version": tpl.version,
        "title": tpl.title,
        "blocks_count": _count_blocks_flat(doc_json),
    }


# ====== 헬퍼: 블록 개수 카운트 ======
def _count_blocks_flat(blocks: List[Dict[str, Any]]) -> int:
    count = 0
    stack: List[Dict[str, Any]] = list(blocks)
    while stack:
        b = stack.pop()
        count += 1
        ch = b.get("children") or []
        if isinstance(ch, list) and ch:
            stack.extend(ch)
    return count


# ====== 전체 템플릿 조회 ======
@router.get("/", response_model=List[Dict[str, Any]])
def list_templates(db: Session = Depends(get_db)):
    templates = db.query(NotionTemplate).order_by(NotionTemplate.id.desc()).all()
    return [
        {
            "id": t.id,
            "key": t.key,
            "title": t.title,
            "version": t.version,
            "description": t.description,
            "preview_url": t.preview_url or "",  # ✅ DB에 저장된 값 사용
        }
        for t in templates
    ]


# ====== 단일 템플릿 조회 ======
@router.get("/{template_id}", response_model=Dict[str, Any])
def get_template(template_id: int, db: Session = Depends(get_db)):
    tpl = db.query(NotionTemplate).filter(NotionTemplate.id == template_id).first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")
    return {
        "id": tpl.id,
        "key": tpl.key,
        "title": tpl.title,
        "version": tpl.version,
        "description": tpl.description,
        "doc_json": tpl.doc_json,
        "preview_url": tpl.preview_url or "",
    }
