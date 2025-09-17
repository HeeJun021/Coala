# app/routers/notion_publish.py
from __future__ import annotations
import logging

from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.template import NotionTemplate, NotionExportHistory

from app.models.project_models import Project
from app.models.project_models import ProjectMembers
from app.models.task_models import Tasks
from app.models.task_models import TaskCollaborators
from app.models.user import User

# ✅ 퍼블리시는 오직 이 모듈만 사용 (AI 치환/재작성 + 스타일 보존 + gpt-5 대응)
# from app.services.ai_doc_rewriter import rewrite_doc_with_ai

# ✅ Notion 페이지 생성 + children append (chunk 처리 포함)
from app.services.notion_api_service import create_page_then_append


router = APIRouter(prefix="/notion", tags=["Notion Publish"])


# ========= 요청 Body =========
class PublishRequest(BaseModel):
    template_id: int = Field(..., description="사용할 템플릿 ID")
    target_page_id: str = Field(..., description="붙여넣을 상위 Notion 페이지 ID")
    title: str = Field(..., description="생성될 하위 페이지 제목")

    # 단일 프로젝트 선택(요구사항) — 프론트는 필수로 보내기
    project_id: Optional[int] = Field(None, description="선택한 단일 프로젝트 ID")

    # 사용자가 작성한 AI 메모(지시사항). 프론트에서 ai_notes로 보낼 때가 있어 폴백 처리함.
    ai_prompt: Optional[str] = Field(None, description="AI 지시사항 메모")

    # 자유 키-값 치환/보조 입력(선택). ex) {"지원자 이름": "홍길동", "ai_notes": "..." }
    extra_kv: Optional[Dict[str, Any]] = Field(
        default=None, description="추가 치환/보조 입력 값"
    )

    # (구버전 호환) 프론트가 아직 filters 구조를 쓰면 받아서 project_id/ai_notes 폴백에 활용
    filters: Optional[Dict[str, Any]] = Field(default=None, description="레거시 필터")


# ========= 프로젝트 데이터 수집 =========
# app/routers/notion_publish.py  => _load_project_kv 교체본
def _load_project_kv(db: Session, project_id: Optional[int]) -> Dict[str, Any]:
    if not project_id:
        return {}

    # --- 모델 임포트(당신의 실제 경로/이름에 맞게 조정) ---

    # 1) 프로젝트 개요
    proj = db.query(Project).filter(Project.project_id == project_id).first()
    if not proj:
        return {}

    # topic, tech_stack 컬럼명이 다르면 맞춰서 변경하세요.
    topic = getattr(proj, "topic", None)
    tech_stack_val = getattr(proj, "tech_stack", None)
    # 배열/JSON이면 문자열화
    if isinstance(tech_stack_val, (list, tuple)):
        tech_stack = ", ".join(map(str, tech_stack_val))
    else:
        tech_stack = str(tech_stack_val) if tech_stack_val is not None else None

    status = "종료" if bool(getattr(proj, "is_closed", False)) else "진행중"

    # 2) 팀원(리더/일반)
    pm_q = (
        db.query(ProjectMembers, User)
        .join(User, User.user_id == ProjectMembers.user_id)
        .filter(ProjectMembers.project_id == project_id)
        .all()
    )
    members: list[str] = []
    leaders: list[str] = []
    for pm, u in pm_q:
        name = (
            getattr(u, "nickname", None)
            or getattr(u, "email", None)
            or f"User#{u.user_id}"
        )
        members.append(name)
        if getattr(pm, "is_leader", False):
            leaders.append(name)

    # 3) 작업 요약(시작일/마감일 + 협업자)
    #   - 필요한 만큼 조정(제목 컬럼 이름, 날짜 컬럼 이름 등)
    tasks = (
        db.query(Tasks)
        .filter(Tasks.project_id == project_id)
        .order_by(Tasks.start_date.asc().nullsfirst())
        .all()
    )

    # task_id 기준으로 협업자 맵
    task_ids = [getattr(t, "task_id") for t in tasks if getattr(t, "task_id", None)]
    collab_map: dict[int, list[str]] = {}
    if task_ids:
        tc_rows = (
            db.query(TaskCollaborators, User)
            .join(User, User.user_id == TaskCollaborators.user_id)
            .filter(TaskCollaborators.task_id.in_(task_ids))
            .all()
        )
        for tc, u in tc_rows:
            nm = (
                getattr(u, "nickname", None)
                or getattr(u, "email", None)
                or f"User#{u.user_id}"
            )
            collab_map.setdefault(getattr(tc, "task_id"), []).append(nm)

    lines: list[str] = []
    for t in tasks:
        title = (
            getattr(t, "title", "")
            or getattr(t, "name", "")
            or f"Task#{getattr(t, 'task_id', '')}"
        )
        start = getattr(t, "start_date", None)
        due = getattr(t, "due_date", None)
        cbs = collab_map.get(getattr(t, "task_id"), [])
        cb_txt = f" / 협업자: {', '.join(cbs)}" if cbs else ""
        date_txt = ""
        if start and due:
            date_txt = f" ({start} ~ {due})"
        elif start:
            date_txt = f" (시작: {start})"
        elif due:
            date_txt = f" (마감: {due})"
        lines.append(f"- {title}{date_txt}{cb_txt}")
    tasks_summary = "\n".join(lines) if lines else None

    # 4) 반환: ai_doc_rewriter의 _MARKER_TO_KV와 **키 이름**을 정확히 맞춘다
    return {
        "project_name": getattr(proj, "name", None),
        "project_description": getattr(proj, "description", None),
        "topic": topic,
        "tech_stack": tech_stack,
        "status": status,
        "is_closed": bool(getattr(proj, "is_closed", False)),
        "start_date": (
            getattr(proj, "start_date", None).isoformat()
            if getattr(proj, "start_date", None)
            else None
        ),
        "end_date": (
            getattr(proj, "end_date", None).isoformat()
            if getattr(proj, "end_date", None)
            else None
        ),
        "tasks_summary": tasks_summary,
        "members": members,
        "leaders": leaders,
    }


# ========= 퍼블리시 엔드포인트 =========
@router.post("/publish")
def publish_to_notion(
    body: PublishRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 0) Notion 연결 확인
    if not current_user or not getattr(current_user, "notion_token", None):
        raise HTTPException(status_code=401, detail="Notion is not connected")

    # 1) 템플릿 로드
    tpl: NotionTemplate | None = (
        db.query(NotionTemplate).filter(NotionTemplate.id == body.template_id).first()
    )
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")

    # doc_json: List[block]
    template_blocks: List[dict] = tpl.doc_json if hasattr(tpl, "doc_json") else []
    if not isinstance(template_blocks, list) or not template_blocks:
        raise HTTPException(status_code=400, detail="Invalid template doc_json")

    # 2) 프로젝트/사용자 기반 KV 수집
    # - 단일 프로젝트만 선택(요구사항). body.project_id는 프론트 최신 스키마.
    # - 레거시(filters.project_ids[0]) 폴백도 지원.
    project_id: Optional[int] = body.project_id
    if (
        not project_id
        and body.filters
        and isinstance(body.filters.get("project_ids"), list)
    ):
        project_ids = body.filters.get("project_ids") or []
        project_id = project_ids[0] if project_ids else None

    base_kv: Dict[str, Any] = _load_project_kv(db, project_id) or {}

    # 사용자 기본 치환값
    user_name = (
        getattr(current_user, "nickname", None)
        or getattr(current_user, "email", None)
        or ""
    )
    user_email = getattr(current_user, "email", None) or ""
    base_kv.setdefault("user_name", user_name)
    base_kv.setdefault("user_email", user_email)

    # 2-1) extra_kv 병합
    if body.extra_kv:
        for k, v in body.extra_kv.items():
            if v is not None:
                base_kv[k] = v

    # 2-2) ai_prompt 폴백 (프론트가 ai_notes로 보내는 경우 대비)
    ai_prompt: Optional[str] = body.ai_prompt
    if not ai_prompt and body.extra_kv:
        ai_prompt = body.extra_kv.get("ai_notes")
    if not ai_prompt and body.filters:
        ai_prompt = body.filters.get("ai_notes")

    # >>> AI OFF 모드: 템플릿 블록 그대로 사용 <<<
    processed_blocks = template_blocks
    meta = {
        "ai_used": False,
        "ai_prompt_len": 0,
        "missing_keys": [],
        "ai_error": None,
        "ai_model_used": None,
    }

    # 3) AI 섹션 재작성 + 대괄호 마커 치환 (스타일 보존)
    # try:
    #     processed_blocks, meta = rewrite_doc_with_ai(
    #         template_blocks=template_blocks,
    #         base_kv=base_kv,
    #         ai_prompt=ai_prompt,
    #     )
    #     ai_model_used = meta.get("ai_model_used")
    #     logging.info(f"[Notion Publish] AI model used: {ai_model_used}")

    # except Exception as e:
    #     # AI 실패 시에도 퍼블리시 자체는 진행할 수 있도록 옵션을 두고 싶다면,
    #     # 여기서 template_blocks로 폴백하여 진행하도록 바꿀 수 있습니다.
    #     raise HTTPException(status_code=500, detail=f"AI rendering failed: {e}")

    # 4) Notion에 페이지 생성 + children append
    try:
        created_page_id = create_page_then_append(
            current_user,  # ← user 객체 그대로 (토큰 내부에서 꺼내 사용)
            body.target_page_id,
            body.title,
            processed_blocks,  # rewrite_doc_with_ai 결과
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Notion publish failed: {e}")

    # 5) ExportHistory 저장(요구사항 필드 기록)
    try:
        hist = NotionExportHistory(
            user_id=getattr(current_user, "user_id"),
            template_id=tpl.id,
            target_page_id=body.target_page_id,
            created_page_id=created_page_id,
            project_id=project_id,
            ai_used=bool(meta.get("ai_used")),
            ai_prompt_len=int(meta.get("ai_prompt_len") or 0),
            missing_keys=meta.get("missing_keys") or [],
            extra_meta={
                "note": "publish_with_ai",
                "marker_values": meta.get("marker_values") or {},
                "ai_error": meta.get("ai_error"),
                "ai_model_used": meta.get("ai_model_used"),  # ✅ 여기서 meta 참조
            },
        )

        db.add(hist)
        db.commit()
    except Exception:
        # 기록 실패는 퍼블리시 성공과 분리(서비스는 성공 반환)
        db.rollback()

    return {
        "ok": True,
        "created_page_id": created_page_id,
        "history": {
            "ai_used": meta.get("ai_used"),
            "ai_prompt_len": meta.get("ai_prompt_len"),
            "missing_keys": meta.get("missing_keys"),
            "ai_error": meta.get("ai_error"),
        },
    }
