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

# 🔗 내부용 Notion 클라이언트 팩토리 (네가 올린 그대로 사용)
from app.services.notion_client import NotionClient  # 타입 힌트용 (선택)
from app.services.notion_internal import get_internal_notion  # <- 네가 가진 헬퍼 경로/이름에 맞춰주세요

# 📥 인제스트 유틸(재귀 children 수집 + 원본 제목 조회)
from app.services.notion_ingest import fetch_all_children, get_page_title

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
    # (선택) 토큰/권한 체크는 프로젝트 정책에 맞춰 추가
    # if not current_user or not hasattr(current_user, "notion_token"):
    #     raise HTTPException(status_code=401, detail="Notion not connected")

    # 1) 내부 Notion 클라이언트 준비
    notion = get_internal_notion()  # NOTION_INTERNAL_TOKEN 기반

    # 2) 원본 페이지 제목 조회
    original_title = get_page_title(notion, body.page_id) or ""

    # 3) 블록 트리 스냅샷 수집
    doc_json: List[Dict[str, Any]] = fetch_all_children(notion, body.page_id)

    # 4) 키 중복 검사 (있으면 version++, 없으면 신규)
    tpl: NotionTemplate | None = (
        db.query(NotionTemplate).filter(NotionTemplate.key == body.key).first()
    )
    if tpl is None:
        tpl = NotionTemplate(
            key=body.key,
            version=1,
            # ✅ 원본 제목을 우선 저장(요청 title 은 폴백)
            title=original_title or (body.title or ""),
            description=body.description or "",
            doc_json=doc_json,
        )
        db.add(tpl)
        db.commit()
        db.refresh(tpl)
    else:
        tpl.version = (tpl.version or 0) + 1
        tpl.title = original_title or (body.title or "")
        if body.description is not None:
            tpl.description = body.description
        tpl.doc_json = doc_json
        db.commit()

    return {
        "ok": True,
        "template_id": tpl.id,
        "key": tpl.key,
        "version": tpl.version,
        "title": tpl.title,
        "blocks_count": _count_blocks_flat(doc_json),
    }


# ====== 헬퍼: 블록 개수 카운트(트리 평탄 순회) ======
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
def list_templates(
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),  # 필요 시 권한 체크
):
    """
    저장된 모든 템플릿 목록 조회
    """
    templates = db.query(NotionTemplate).order_by(NotionTemplate.id.desc()).all()
    return [
        {
            "id": t.id,
            "key": t.key,
            "title": t.title,
            "version": t.version,
            "description": t.description,
        }
        for t in templates
    ]
