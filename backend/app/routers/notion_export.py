# backend/app/routers/notion_export.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User

from app.services.notion_export_service import create_portfolio_page

router = APIRouter(prefix="/notion", tags=["Notion Export"])

class ExportFilters(BaseModel):
    date_from: Optional[str] = None   # "2025-01-01"
    date_to: Optional[str] = None
    include_projects: bool = True
    include_quiz: bool = True
    include_codingtest: bool = True
    include_tech: bool = True
    project_ids: Optional[list[int]] = None
    # 필요 시 추가...

class ExportBody(BaseModel):
    template_url_or_id: str = Field(..., description="노션 템플릿 URL 또는 ID")
    parent_page_url_or_id: Optional[str] = Field(None, description="부모 페이지 URL 또는 ID")
    parent_database_url_or_id: Optional[str] = Field(None, description="부모 데이터베이스 URL 또는 ID")
    title: str = Field(..., description="생성될 페이지 제목")
    filters: ExportFilters

@router.post("/export")
def export_to_notion(
    body: ExportBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    필터 → 코알라 데이터 집계 → 템플릿 치환 → 노션 페이지 생성
    """
    try:
        # 1) 코알라 DB에서 사용자/활동 데이터 집계 → KV
        kv: Dict[str, Any] = build_kv_from_filters(db, current_user, body.filters)

        # 2) 노션 페이지 생성
        result = create_portfolio_page(
            db,
            current_user.user_id,
            template_url_or_id=body.template_url_or_id,
            parent_url_or_id=body.parent_page_url_or_id,
            parent_database_url_or_id=body.parent_database_url_or_id,
            title=body.title,
            kv=kv,
        )
        return result
    except PermissionError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export 실패: {e}")

# ---------------------------
# 샘플: 코알라 데이터 → KV 빌드
# ---------------------------
def build_kv_from_filters(db: Session, user: User, filters: ExportFilters) -> Dict[str, Any]:
    """
    실제 환경에서는 프로젝트/퀴즈/코딩테스트 등 서비스 레이어에서 가져와 요약 문자열을 생성.
    여기선 1차 버전 예시를 제공.
    """
    # 기본 사용자 정보
    name = getattr(user, "nickname", None) or getattr(user, "email", "User")
    rating = getattr(user, "rating", None)
    tier = getattr(user, "tier_id", None)

    # TODO: 실제 쿼리로 대체
    tech_stack_list = ["React", "FastAPI", "PostgreSQL"]
    projects_summary = "- Coala 플랫폼 개발 (2025)\n- ERD 설계 툴 구현\n- 퀴즈/코딩테스트 모듈"

    quiz_stats = "총 120문제, 정답 95, 정답률 79%"
    codingtest_stats = "총 제출 34회, 주간 평균 3.1회"

    kv = {
        "name": name,
        "nickname": getattr(user, "nickname", "") or "",
        "email": getattr(user, "email", "") or "",
        "rating": rating if rating is not None else "",
        "tier": tier if tier is not None else "",
        "tech_stack": ", ".join(tech_stack_list),
        "projects": projects_summary,
        "quiz_stats": quiz_stats if filters.include_quiz else "",
        "codingtest_stats": codingtest_stats if filters.include_codingtest else "",
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
    }

    # 필요 시 filters.date_from/date_to, project_ids 반영
    return kv
