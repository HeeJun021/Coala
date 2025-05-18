# backend/app/routers/project.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.schemas.project import ProjectCreateRequest
from app.models import Project, ProjectMembers, Users, ProjectWidgets
router = APIRouter(prefix="/projects", tags=["Projects"])

# ✅ 1. 내 프로젝트 목록 조회
@router.get("/my")
def get_my_projects(db: Session = Depends(get_db), current_user: Users = Depends(get_current_user)):
    projects = (
        db.query(Project)
        .join(ProjectMembers, Project.project_id == ProjectMembers.project_id)
        .filter(ProjectMembers.user_id == current_user.user_id)
        .all()
    )
    return [
        {
            "project_id": p.project_id,
            "name": p.name,
            "description": p.description,
            "progress": p.progress,
        }
        for p in projects
    ]

# ✅ 2. 프로젝트 팀원 목록 조회
@router.get("/{project_id}/members")
def get_project_members(project_id: int, db: Session = Depends(get_db)):
    members = (
        db.query(Users)
        .join(ProjectMembers, Users.user_id == ProjectMembers.user_id)
        .filter(ProjectMembers.project_id == project_id)
        .all()
    )
    return [
        {
            "user_id": m.user_id,
            "nickname": m.nickname,
            "email": m.email,
        }
        for m in members
    ]

@router.post("/projects")
def create_project(
    project_data: ProjectCreateRequest,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_user)
):
    # 1. 프로젝트 생성
    new_project = Project(
        name=project_data.name,
        description=project_data.description,
        created_by=current_user.user_id
    )
    db.add(new_project)
    db.flush()  # project_id 확보

    # 2. 팀 리더 등록
    member = ProjectMembers(
        project_id=new_project.project_id,
        user_id=current_user.user_id,
        is_leader=True
    )
    db.add(member)

    # 3. 위젯 저장
    if project_data.widgets.erd:
        db.add(ProjectWidgets(project_id=new_project.project_id, widget_type="erd"))
    if project_data.widgets.git:
        db.add(ProjectWidgets(project_id=new_project.project_id, widget_type="git"))
    if project_data.widgets.memo:
        db.add(ProjectWidgets(project_id=new_project.project_id, widget_type="memo"))
    if project_data.widgets.calendar:
        db.add(ProjectWidgets(project_id=new_project.project_id, widget_type="calendar"))

    db.commit()
    return {"project_id": new_project.project_id}
