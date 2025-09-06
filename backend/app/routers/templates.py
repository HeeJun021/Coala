# app/routers/templates.py
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import List, Any, Dict, Optional
from copy import deepcopy

from app.database import get_db
from app.dependencies.auth import get_current_user

# 프로젝트/권한/로그
from app.models.project_models import Project, ProjectMembers, ProjectActivityLog
from app.models.user import User

# 모델
from app.models.templates_models import ProjectTemplate, TemplateLibrary

# 스키마
from app.schemas.templates_schemas import (
    ProjectTemplateCreateRequest,
    ProjectTemplateUpdateRequest,
    ProjectTemplateResponse,
    TemplateLibraryCreate,
    TemplateLibraryResponse,
    ApplyFromLibraryRequest,
)

# ===== 공통 유틸 =====
def _get_project_or_404(db: Session, project_id: int) -> Project:
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

def _assert_leader(db: Session, project_id: int, user: User):
    leader = (
        db.query(ProjectMembers)
        .filter(
            ProjectMembers.project_id == project_id,
            ProjectMembers.user_id == user.user_id,
            ProjectMembers.is_leader == True,
        )
        .first()
    )
    if not leader:
        raise HTTPException(status_code=403, detail="Only leader can perform this action")

def _resolve_str(s: str, ctx: Dict[str, Any]) -> str:
    out = s
    for k, v in {
        "{{project.name}}": ctx["project"]["name"],
        "{{owner.nickname}}": ctx["owner"]["nickname"],
        "{{today}}": ctx["today"],
    }.items():
        out = out.replace(k, str(v))
    return out

def _walk_and_resolve(obj, ctx):
    if isinstance(obj, dict):
        return {k: _walk_and_resolve(v, ctx) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_walk_and_resolve(x, ctx) for x in obj]
    if isinstance(obj, str):
        return _resolve_str(obj, ctx)
    return obj

def _derive_widgets(blocks_resolved: dict) -> List[str]:
    # UI 카드에 필요한 경량 키 추출 (필요 시 고도화)
    layout = blocks_resolved.get("layout") or []
    return layout if isinstance(layout, list) else []

# ===== Router (하나의 파일에 모두 정의) =====
router = APIRouter(tags=["Templates & Library"])

# ---------------------------
# 전역 라이브러리 API
# ---------------------------

@router.get("/template-library", response_model=List[TemplateLibraryResponse])
def list_library(db: Session = Depends(get_db)):
    items = (
        db.query(TemplateLibrary)
        .filter(TemplateLibrary.is_published == True)
        .order_by(TemplateLibrary.id.desc())
        .all()
    )
    return items

@router.post("/template-library", response_model=TemplateLibraryResponse)
def create_library_item(
    data: TemplateLibraryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # 필요 시 관리자 체크 추가
):
    item = TemplateLibrary(
        title=data.title,
        description=data.description,
        category=data.category,
        tags=data.tags,
        blocks=data.blocks,
        thumbnail_url=data.thumbnail_url,
        version=data.version or 1,
        is_published=True if data.is_published is None else data.is_published,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.post("/template-library/bulk", response_model=List[TemplateLibraryResponse])
def bulk_import_library(
    items: List[TemplateLibraryCreate] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # 필요 시 관리자 체크 추가
):
    created = []
    for data in items:
        it = TemplateLibrary(
            title=data.title,
            description=data.description,
            category=data.category,
            tags=data.tags,
            blocks=data.blocks,
            thumbnail_url=data.thumbnail_url,
            version=data.version or 1,
            is_published=True if data.is_published is None else data.is_published,
        )
        db.add(it)
        created.append(it)
    db.commit()
    for it in created:
        db.refresh(it)
    return created

# ---------------------------
# 프로젝트 템플릿(인스턴스) API
# 기존 경로와 호환: /projects/{project_id}/templates ...
# ---------------------------

@router.get("/projects/{project_id}/templates", response_model=List[ProjectTemplateResponse])
def list_templates(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_project_or_404(db, project_id)
    templates = (
        db.query(ProjectTemplate)
        .filter(ProjectTemplate.project_id == project_id)
        .order_by(ProjectTemplate.added_at.desc())
        .all()
    )
    return templates

@router.get("/projects/{project_id}/templates/{template_id}", response_model=ProjectTemplateResponse)
def get_template(
    project_id: int,
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_project_or_404(db, project_id)
    t = (
        db.query(ProjectTemplate)
        .filter(ProjectTemplate.project_id == project_id,
                ProjectTemplate.template_id == template_id)
        .first()
    )
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    return t

@router.post("/projects/{project_id}/templates", response_model=ProjectTemplateResponse)
def create_template(
    project_id: int,
    template_data: ProjectTemplateCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_project_or_404(db, project_id)
    _assert_leader(db, project_id, current_user)

    new_t = ProjectTemplate(
        project_id=project_id,
        title=template_data.title,
        description=template_data.description,
        widgets=template_data.widgets,
    )
    db.add(new_t)

    db.add(
        ProjectActivityLog(
            project_id=project_id,
            actor_id=current_user.user_id,
            action=f"{current_user.nickname}이(가) 템플릿 '{template_data.title}'을(를) 추가함",
            created_at=datetime.now(),
        )
    )

    db.commit()
    db.refresh(new_t)
    return new_t

@router.patch("/projects/{project_id}/templates/{template_id}", response_model=ProjectTemplateResponse)
def update_template(
    project_id: int,
    template_id: int,
    template_data: ProjectTemplateUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_project_or_404(db, project_id)
    _assert_leader(db, project_id, current_user)

    t = (
        db.query(ProjectTemplate)
        .filter(
            ProjectTemplate.template_id == template_id,
            ProjectTemplate.project_id == project_id,
        )
        .first()
    )
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")

    if template_data.title is not None:
        t.title = template_data.title
    if template_data.description is not None:
        t.description = template_data.description
    if template_data.widgets is not None:
        t.widgets = template_data.widgets
    if template_data.applied_blocks is not None:
        t.applied_blocks = template_data.applied_blocks
    db.commit()
    db.refresh(t)
    return t

@router.delete("/projects/{project_id}/templates/{template_id}")
def delete_template(
    project_id: int,
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_project_or_404(db, project_id)
    _assert_leader(db, project_id, current_user)

    t = (
        db.query(ProjectTemplate)
        .filter(
            ProjectTemplate.template_id == template_id,
            ProjectTemplate.project_id == project_id,
        )
        .first()
    )
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")

    db.add(
        ProjectActivityLog(
            project_id=project_id,
            actor_id=current_user.user_id,
            action=f"{current_user.nickname}이(가) 템플릿 '{t.title}'을(를) 삭제함",
            created_at=datetime.now(),
        )
    )

    db.delete(t)
    db.commit()
    return {"message": "Template deleted successfully"}

# ---------------------------
# 전역 라이브러리 → 프로젝트에 적용
# POST /projects/{project_id}/templates/from-library
# ---------------------------

@router.post("/projects/{project_id}/templates/from-library", response_model=ProjectTemplateResponse)
def apply_from_library(
    project_id: int,
    body: ApplyFromLibraryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_project_or_404(db, project_id)
    _assert_leader(db, project_id, current_user)

    library = (
        db.query(TemplateLibrary)
        .filter(
            TemplateLibrary.id == body.library_id,
            TemplateLibrary.is_published == True,
        )
        .first()
    )
    if not library:
        raise HTTPException(status_code=404, detail="Library template not found")

    # 변수 치환 컨텍스트 생성
    ctx = {
        "project": {"name": project.name, "id": project.project_id},
        "owner": {"nickname": current_user.nickname, "id": current_user.user_id},
        "today": date.today().isoformat(),
    }
    blocks_resolved = _walk_and_resolve(deepcopy(library.blocks), ctx)

    # TODO: 필요하면 내부 리소스(kanban/table 등) 실제로 생성하고 id 주입

    pt = ProjectTemplate(
        project_id=project.project_id,
        title=library.title,
        description=library.description,
        library_id=library.id,
        applied_blocks=blocks_resolved,
        widgets=_derive_widgets(blocks_resolved),
    )
    db.add(pt)

    db.add(
        ProjectActivityLog(
            project_id=project_id,
            actor_id=current_user.user_id,
            action=f"{current_user.nickname}이(가) 라이브러리 템플릿 '{library.title}'을(를) 적용함",
            created_at=datetime.now(),
        )
    )

    db.commit()
    db.refresh(pt)
    return pt

@router.post("/template-library/seed")
def seed_template_library(
    items: List[dict] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    created = 0
    for it in items:
        lib = TemplateLibrary(
            title=it["title"],
            description=it.get("description"),
            category=it.get("category"),
            tags=it.get("tags"),
            blocks=it["blocks"],  # ← 카탈로그의 applied_blocks와 동일 구조를 저장
            thumbnail_url=it.get("thumbnail_url"),
            version=it.get("version", 1),
            is_published=it.get("is_published", True),
        )
        db.add(lib)
        created += 1
    db.commit()
    return {"created": created}

@router.get("/template-library")
def list_template_library(
    published: Optional[int] = Query(None, description="1이면 공개 템플릿만"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(TemplateLibrary)
    if published == 1:
        q = q.filter(TemplateLibrary.is_published.is_(True))
    rows = q.order_by(TemplateLibrary.id.asc()).all()
    # blocks는 빼고 반환
    return [
        {
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "category": r.category,
            "tags": r.tags,
            "thumbnail_url": r.thumbnail_url,
            "version": r.version,
            "is_published": r.is_published,
        }
        for r in rows
    ]
    
@router.get("/template-library/{library_id}")
def get_template_library_item(
    library_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lib = db.query(TemplateLibrary).get(library_id)
    if not lib:
        raise HTTPException(status_code=404, detail="Library item not found")
    return {
        "id": lib.id,
        "title": lib.title,
        "description": lib.description,
        "category": lib.category,
        "tags": lib.tags,
        "thumbnail_url": lib.thumbnail_url,
        "version": lib.version,
        "is_published": lib.is_published,
        "blocks": lib.blocks,  # ← 여기 담긴 게 applied_blocks로 쓸 구조
    }   

@router.post("/projects/{project_id}/templates/from-library", response_model=ProjectTemplateResponse)
def create_template_from_library(
    project_id: int,
    library_id: int = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 라이브러리 로드
    lib = db.query(TemplateLibrary).get(library_id)
    if not lib:
        raise HTTPException(status_code=404, detail="Library item not found")

    # 프로젝트 템플릿 생성 (applied_blocks = lib.blocks)
    t = ProjectTemplate(
        project_id=project_id,
        title=lib.title,
        description=lib.description,
        widgets=list({(lib.blocks or {}).get("layout", [])[0].split(":")[0]}) if lib.blocks else [],
        library_id=lib.id,
        applied_blocks=lib.blocks,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return t