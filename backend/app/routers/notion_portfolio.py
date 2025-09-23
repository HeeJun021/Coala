from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.template import NotionExportHistory, NotionTemplate
from app.models.project_models import Project
from app.dependencies.auth import get_current_user
from app.schemas.notion_schemas import ExportHistoryItem, ExportHistoryListResponse

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

@router.get("/history", response_model=ExportHistoryListResponse)
def get_export_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
):
    q = (
        db.query(NotionExportHistory)
        .filter(NotionExportHistory.user_id == current_user.user_id)
        .order_by(NotionExportHistory.created_at.desc())
    )

    total = q.count()
    rows = q.offset((page - 1) * limit).limit(limit).all()

    items: List[ExportHistoryItem] = []
    for r in rows:
        meta = r.extra_meta or {}

        # 템플릿 이름 가져오기
        tpl = db.query(NotionTemplate).filter(NotionTemplate.id == r.template_id).first()
        template_name = tpl.title if tpl else None   # ← ⚡ 여기서 'title' 컬럼 사용

        # 프로젝트 이름 가져오기
        proj = db.query(Project).filter(Project.project_id == r.project_id).first() if r.project_id else None
        project_name = proj.name if proj else None

        items.append(
            ExportHistoryItem(
                export_id=r.id,
                title=meta.get("title_after") or template_name or f"템플릿 {r.template_id}",
                status=meta.get("status", "success"),
                block_count=meta.get("block_count", 0),
                duration_ms=meta.get("duration_ms", 0),
                created_at=r.created_at.isoformat() if r.created_at else "",
                page_id=r.created_page_id,
                project_name=project_name,
                template_name=template_name,
                ai_used=r.ai_used,
                error_msg=meta.get("error_msg"),
            )
        )

    return ExportHistoryListResponse(items=items, total=total)
