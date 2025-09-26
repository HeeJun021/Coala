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

from app.models.project_models import Project, ProjectMembers
from app.models.task_models import Tasks, TaskCollaborators
from app.services.notion_ai_service import polish_with_ai

import json

# ✅ 서비스 유틸: 테이블 퍼블리시 + 치환 + 제목 업데이트
from app.services.notion_api_service import (
    append_blocks_to_page,
    replace_placeholders_in_blocks,  # 1:1 본문 치환(이미 구현돼 있다면 그대로 사용)
    _replace_in_text,                # 제목/단일 문자열 치환
    update_page_title,               # 노션 페이지 제목 PATCH
)

# ✅ 포트폴리오 프로필 모델 (full_name, birth_date, phone, email, education, career 등)
from app.models.portfolio_profile_models import UserPortfolioProfile

router = APIRouter(prefix="/notion", tags=["Notion Publish"])


# ========= 요청 Body =========
class PublishRequest(BaseModel):
    template_id: int = Field(..., description="사용할 템플릿 ID")
    target_page_id: str = Field(..., description="붙여넣을 상위 Notion 페이지 ID")
    title: str = Field(..., description="노션 페이지 제목(치환 대상)")

    # 단일 프로젝트 선택(요구사항)
    project_id: Optional[int] = Field(None, description="선택한 단일 프로젝트 ID")

    # 사용자가 작성한 AI 메모(지시사항). (지금은 AI OFF지만 필드만 유지)
    ai_prompt: Optional[str] = Field(None, description="AI 지시사항 메모")

    # 자유 키-값 치환/보조 입력(선택). ex) {"자기소개": "...", "학적 사항": "..."}
    extra_kv: Optional[Dict[str, Any]] = Field(default=None, description="추가 치환/보조 입력 값")

    # (레거시) 프론트가 아직 filters 구조를 쓰면 받아서 project_id/ai_notes 폴백에 활용
    filters: Optional[Dict[str, Any]] = Field(default=None, description="레거시 필터")


# ========= 프로젝트 데이터 수집 =========
def _load_project_kv(db: Session, project_id: Optional[int]) -> Dict[str, Any]:
    if not project_id:
        return {}
    proj = db.query(Project).filter(Project.project_id == project_id).first()
    if not proj:
        return {}

    topic = getattr(proj, "topic", None)
    tech_stack_val = getattr(proj, "tech_stack", None)
    if isinstance(tech_stack_val, (list, tuple)):
        tech_stack = ", ".join(map(str, tech_stack_val))
    else:
        tech_stack = str(tech_stack_val) if tech_stack_val is not None else None

    base = {
        # 영문 키(기존)
        "project_name": getattr(proj, "name", None),
        "project_description": getattr(proj, "description", None),
        "topic": topic,
        "tech_stack": tech_stack,
    }

    # ✅ 한글 토큰 별칭(템플릿의 대괄호 키와 1:1 매칭)
    base["프로젝트명"] = base["project_name"]
    base["프로젝트설명"] = base["project_description"]
    base["프로젝트 주제"] = base["topic"]
    base["기술 스택"] = base["tech_stack"]

    return base



def _ensure_list(obj):
    """DB JSON 컬럼이 문자열로 반환될 수도 있으므로 항상 list로 보정"""
    if not obj:
        return []
    if isinstance(obj, str):
        try:
            return json.loads(obj)
        except Exception:
            return []
    if isinstance(obj, list):
        return obj
    return []

def _listify(arr, keys):
    """dict list에서 필요한 키만 뽑아 ' / ' 로 합친 문자열 리스트 반환"""
    out = []
    for row in arr:
        if isinstance(row, dict):
            parts = [str(row.get(k)) for k in keys if row.get(k)]
            if parts:
                out.append(" / ".join(parts))
    return out

def _load_portfolio_profile_kv(db: Session, user_id: int) -> Dict[str, Any]:
    prof = db.query(UserPortfolioProfile).filter(
        UserPortfolioProfile.user_id == user_id
    ).first()
    if not prof:
        return {}

    # JSON 컬럼 보정
    education_raw = _ensure_list(getattr(prof, "education", None))
    career_raw    = _ensure_list(getattr(prof, "career", None))

    education_list = _listify(education_raw, ["school", "major", "period", "desc"])
    career_list    = _listify(career_raw, ["company", "role", "period", "desc"])

    full_name = getattr(prof, "full_name", "") or ""
    birth_date = getattr(prof, "birth_date", None)
    birth_str = str(birth_date) if birth_date else ""
    phone = getattr(prof, "phone", "") or ""
    email = getattr(prof, "email", "") or ""

    return {
        "이름": full_name,
        "생년월일": birth_str,
        "전화번호": phone,
        "이메일": email,
        "학적 사항": education_list,
        "경력 사항": career_list,
        "자기소개": "",
        "경험": "",
    }


def _load_project_kv(db: Session, project_id: Optional[int]) -> Dict[str, Any]:
    if not project_id:
        return {}
    proj = db.query(Project).filter(Project.project_id == project_id).first()
    if not proj:
        return {}

    topic = getattr(proj, "topic", None)
    tech_stack_val = getattr(proj, "tech_stack", None)
    if isinstance(tech_stack_val, (list, tuple)):
        tech_stack = ", ".join(map(str, tech_stack_val))
    else:
        tech_stack = str(tech_stack_val) if tech_stack_val is not None else None

    base = {
        "프로젝트명": getattr(proj, "name", None),
        "프로젝트설명": getattr(proj, "description", None),
        "프로젝트 주제": topic,
        "기술 스택": tech_stack,
    }

    # 🔹 프로젝트 역할 (닉네임 + 역할)
    members = (
        db.query(ProjectMembers)
        .filter(ProjectMembers.project_id == project_id, ProjectMembers.status == "accepted")
        .all()
    )
    role_list = []
    for m in members:
        nick = getattr(m.user, "nickname", None) if hasattr(m, "user") else None
        roles = getattr(m, "roles", None)
        role_str = f"{nick} ({roles})" if roles else nick
        if role_str:
            role_list.append(role_str)

    base["프로젝트 역할"] = role_list

    return base



# ========= 퍼블리시 엔드포인트 =========
@router.post("/publish")
def publish_to_notion(
    body: PublishRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user or not getattr(current_user, "notion_token", None):
        raise HTTPException(status_code=401, detail="Notion is not connected")

    tpl: NotionTemplate | None = (
        db.query(NotionTemplate).filter(NotionTemplate.id == body.template_id).first()
    )
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")

    template_blocks: List[dict] = tpl.doc_json if hasattr(tpl, "doc_json") else []
    if not isinstance(template_blocks, list) or not template_blocks:
        raise HTTPException(status_code=400, detail="Invalid template doc_json")

    # 1) 치환용 KV 구성 (프로필 + 프로젝트 + 추가 입력)
    project_id: Optional[int] = body.project_id
    if (
        not project_id
        and body.filters
        and isinstance(body.filters.get("project_ids"), list)
    ):
        project_ids = body.filters.get("project_ids") or []
        project_id = project_ids[0] if project_ids else None

    # ⬇️ kv는 무조건 여기서 초기화해야 함
    kv: Dict[str, Any] = {}
    kv.update(_load_portfolio_profile_kv(db, getattr(current_user, "user_id")))
    kv.update(_load_project_kv(db, project_id))

        # ✅ 사용자 입력 → AI 다듬기 후 치환
    if body.extra_kv:
        intro_val = body.extra_kv.get("intro_text") or body.extra_kv.get("ai_prompt_intro")
        exp_val   = body.extra_kv.get("experience_text") or body.extra_kv.get("ai_prompt_experience")

        # AI 다듬기 OFF 상태
        # if intro_val:
        #     kv["자기소개"] = polish_with_ai(intro_val, purpose="자기소개")
        # if exp_val:
        #     polished_exp = polish_with_ai(exp_val, purpose="경험/느낀점")
        #     kv["ai 메모에 넣은 내용 토대로 느낀점 작성"] = polished_exp
        #     kv["경험"] = polished_exp

        SAFE_LIST_KEYS = {"학적 사항", "경력 사항", "프로젝트 역할"}

        def _maybe_parse_list(val):
            if isinstance(val, str):
                s = val.strip()
                if not s:
                    return None
                try:
                    parsed = json.loads(s)
                    if isinstance(parsed, list):
                        return parsed
                except Exception:
                    return None
            return val if isinstance(val, list) else None

        # 나머지 값도 안전하게 병합
        for k, v in body.extra_kv.items():
            if v is None:
                continue

            # 공백 문자열 무시
            if isinstance(v, str) and not v.strip():
                continue

            # 리스트 키거나 기존 kv가 리스트라면 보호
            if k in SAFE_LIST_KEYS or isinstance(kv.get(k), list):
                parsed = _maybe_parse_list(v)
                if parsed is None:
                    continue
                if isinstance(parsed, list):
                    kv[k] = parsed
                else:
                    continue
            else:
                kv[k] = v





    # 2) 제목 치환 + 업데이트
    page_title_processed = ""
    try:
        page_title_processed = _replace_in_text(body.title or "", kv)
        if page_title_processed:
            update_page_title(current_user, body.target_page_id, page_title_processed)
    except Exception as e:
        logging.exception("Failed to update title: %s", e)
        # 제목 실패해도 본문 append는 계속 진행

    # 3) 본문 블록 치환 (1:1 대치 완료되어 있다면 그대로 유지 가능)
    try:
        processed_blocks = replace_placeholders_in_blocks(template_blocks, kv)
        from app.services.notion_api_service import _flatten_blocks
        processed_blocks = _flatten_blocks(processed_blocks)
    except Exception as e:
        logging.exception("Placeholder replace failed: %s", e)
        processed_blocks = template_blocks  # 방어: 실패 시 원본 그대로

    # 치환 결과 미리보기 로그
    import json
    logging.info(
        "[Notion Publish] processed_blocks_preview=%s",
        json.dumps(processed_blocks[:3], ensure_ascii=False)[:1500],
    )

    # 4) Append
    try:
        created_on_page_id = append_blocks_to_page(
            current_user,
            body.target_page_id,
            processed_blocks,
        )
    except Exception as e:
        err_txt = getattr(getattr(e, "response", None), "text", None) or str(e)
        err_status = getattr(getattr(e, "response", None), "status_code", None)
        logging.exception("Notion publish failed: %s", err_txt)
        raise HTTPException(
            status_code=500,
            detail=f"Notion publish failed (status={err_status}): {err_txt}",
        )

    # 5) 히스토리 저장(선택)
    try:
        hist = NotionExportHistory(
            user_id=getattr(current_user, "user_id"),
            template_id=tpl.id,
            target_page_id=body.target_page_id,
            created_page_id=created_on_page_id,  # = target_page_id
            project_id=project_id,
            ai_used=False,
            ai_prompt_len=0,
            missing_keys=[],
            extra_meta={
                "note": "publish_with_title_and_1to1_replacement",
                "title_after": page_title_processed,
            },
        )
        db.add(hist)
        db.commit()
    except Exception:
        db.rollback()

    compact_id = str(created_on_page_id).replace("-", "")
    page_url = f"https://www.notion.so/{compact_id}"

    return {
        "ok": True,
        "created_page_id": created_on_page_id,
        "page_url": page_url,  # 🔹 추가
        "title": page_title_processed,
        "replaced_keys": sorted(list(kv.keys())),
    }
