from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.schemas.project_schemas import ProjectCreateRequest, ProjectUpdateRequest
from app.models.project_models import Project, ProjectMembers, ProjectWidgets, ProjectActivityLog
from datetime import datetime
from app.models.user import User
from typing import List
from app.schemas.project_schemas import UpdateMemberRolesRequest

router = APIRouter(prefix="/projects", tags=["Projects"])


def ensure_project_open(db: Session, project_id: int) -> Project:
    proj = db.query(Project).filter(Project.project_id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    if proj.is_closed:
        raise HTTPException(status_code=403, detail="Project is closed (read-only)")
    return proj


# 1. 내 프로젝트 목록 조회
@router.get("/my")
def get_my_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    projects = (
        db.query(Project)
        .join(ProjectMembers, Project.project_id == ProjectMembers.project_id)
        .filter(
            ProjectMembers.user_id == current_user.user_id,
            ProjectMembers.status == "accepted",
            # ❌ Project.is_closed == False  제거
        )
        .order_by(Project.is_closed.asc(), Project.created_at.desc())  # ✅ 선택
        .all()
    )
    return [
        {
            "project_id": p.project_id,
            "name": p.name,
            "description": p.description,
            "progress": p.progress,
            "topic": p.topic,
            "tech_stack": p.tech_stack,
            "is_closed": p.is_closed,  # ✅ 추가
            "leader_id": (
                db.query(ProjectMembers)
                .filter(ProjectMembers.project_id == p.project_id, ProjectMembers.is_leader == True)
                .first()
                .user_id
                if db.query(ProjectMembers)
                .filter(ProjectMembers.project_id == p.project_id, ProjectMembers.is_leader == True)
                .first()
                else None
            ),
            "widgets": {
                widget.widget_type: True
                for widget in db.query(ProjectWidgets).filter(ProjectWidgets.project_id == p.project_id).all()
            },
            "widget_order": p.widget_order or ["overview"],
        }
        for p in projects
    ]

# 2. 프로젝트 팀원 목록 조회 (roles 추가)
@router.get("/{project_id}/members")
def get_project_members(project_id: int, db: Session = Depends(get_db)):
    members = (
        db.query(User, ProjectMembers.is_leader, ProjectMembers.status, ProjectMembers.roles,)
        .join(ProjectMembers, User.user_id == ProjectMembers.user_id)
        .filter(ProjectMembers.project_id == project_id)
        .all()
    )
    return [
        {
            "user_id": m[0].user_id,
            "nickname": m[0].nickname,
            "email": m[0].email,
            "is_leader": m[1],
            "status": m[2],
            "roles": m[3] or [],
        }
        for m in members
    ]

# 3. 프로젝트 생성
@router.post("")
def create_project(
    project_data: ProjectCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = Project(
        name=project_data.name,
        description=project_data.description,
        created_at=datetime.now(),
        updated_at=datetime.now(),
        widget_order=project_data.widget_order,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # 위젯 추가
    for widget_type, enabled in project_data.widgets.dict().items():
        if enabled:
            db.add(ProjectWidgets(project_id=project.project_id, widget_type=widget_type))
    
    # 생성자를 팀장으로 추가
    db.add(ProjectMembers(
        project_id=project.project_id,
        user_id=current_user.user_id,
        is_leader=True,
        status="accepted"
    ))
    
    # 활동 로그 추가
    db.add(ProjectActivityLog(
        project_id=project.project_id,
        actor_id=current_user.user_id,
        action=f"{current_user.nickname}이(가) 프로젝트를 생성함",
        created_at=datetime.now()
    ))
    
    db.commit()
    return {
        "project_id": project.project_id,
        "name": project.name,
        "description": project.description,
        "widgets": project_data.widgets,
        "widget_order": project.widget_order,
        "created_at": project.created_at
    }

# 4. 프로젝트 수정
@router.patch("/{project_id}")
def update_project(
    project_id: int,
    project_data: ProjectUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ensure_project_open(db, project_id)  # ✅ 종료된 프로젝트면 403
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 리더 여부 확인
    current_leader = db.query(ProjectMembers).filter(
        ProjectMembers.project_id == project_id,
        ProjectMembers.user_id == current_user.user_id,
        ProjectMembers.is_leader == True
    ).first()
    if not current_leader:
        raise HTTPException(status_code=403, detail="Only leader can update project")

    # 업데이트 적용
    if project_data.name is not None:
        project.name = project_data.name
    if project_data.description is not None:
        project.description = project_data.description
    if project_data.topic is not None:
        project.topic = project_data.topic
    if project_data.tech_stack is not None:
        project.tech_stack = project_data.tech_stack
    if project_data.widget_order is not None:
        project.widget_order = project_data.widget_order
    if project_data.widgets is not None:
        # 기존 위젯 삭제
        db.query(ProjectWidgets).filter(ProjectWidgets.project_id == project_id).delete()
        # 새 위젯 추가
        for widget_type, enabled in project_data.widgets.dict().items():
            if enabled:
                db.add(ProjectWidgets(project_id=project_id, widget_type=widget_type))

    project.updated_at = datetime.now()
    db.commit()
    db.refresh(project)
    
    return {
        "project_id": project.project_id,
        "name": project.name,
        "description": project.description,
        "topic": project.topic,
        "tech_stack": project.tech_stack,
        "widgets": {
            widget.widget_type: True
            for widget in db.query(ProjectWidgets).filter(ProjectWidgets.project_id == project_id).all()
        },
        "widget_order": project.widget_order
    }

# 5. 팀장 권한 이전
@router.post("/{project_id}/transfer-leader")
def transfer_leader(project_id: int, data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ensure_project_open(db, project_id)  # ✅
    current_leader = db.query(ProjectMembers).filter(
        ProjectMembers.project_id == project_id,
        ProjectMembers.user_id == current_user.user_id,
        ProjectMembers.is_leader == True
    ).first()
    if not current_leader:
        raise HTTPException(status_code=403, detail="Only leader can transfer leadership")

    new_leader_id = data.get("new_leader_id")
    if not new_leader_id:
        raise HTTPException(status_code=400, detail="New leader ID is required")

    new_leader = db.query(ProjectMembers).filter(
        ProjectMembers.project_id == project_id,
        ProjectMembers.user_id == new_leader_id
    ).first()
    if not new_leader:
        raise HTTPException(status_code=404, detail="New leader not found in project")

    current_leader.is_leader = False
    new_leader.is_leader = True

    new_leader_user = db.query(User).filter(User.user_id == new_leader_id).first()
    db.add(ProjectActivityLog(
        project_id=project_id,
        actor_id=current_user.user_id,
        action=f"{current_user.nickname}이(가) 팀장 권한을 {new_leader_user.nickname}에게 이전함",
        created_at=datetime.now()
    ))

    db.commit()
    return {"message": "Leadership transferred successfully"}

# 6. 멤버 추가
@router.post("/{project_id}/members")
def add_member(project_id: int, data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required")
    
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    existing_member = db.query(ProjectMembers).filter(
        ProjectMembers.project_id == project_id,
        ProjectMembers.user_id == user_id
    ).first()
    if existing_member:
        raise HTTPException(status_code=400, detail="User is already a member")
    
    db.add(ProjectMembers(
        project_id=project_id,
        user_id=user_id,
        status="pending"
    ))
    db.add(ProjectActivityLog(
        project_id=project_id,
        actor_id=current_user.user_id,
        action=f"{current_user.nickname}이(가) {user.nickname}을(를) 프로젝트에 초대함",
        created_at=datetime.now()
    ))
    
    db.commit()
    return {"message": "Member invited successfully"}

# 7. 멤버 방출
@router.delete("/{project_id}/members/{user_id}")
def remove_member(project_id: int, user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ensure_project_open(db, project_id)
    member = db.query(ProjectMembers).filter(
        ProjectMembers.project_id == project_id,
        ProjectMembers.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    if member.is_leader:
        raise HTTPException(status_code=403, detail="Cannot remove leader")
    
    user = db.query(User).filter(User.user_id == user_id).first()
    db.add(ProjectActivityLog(
        project_id=project_id,
        actor_id=current_user.user_id,
        action=f"{current_user.nickname}이(가) {user.nickname}을(를) 프로젝트에서 제외함",
        created_at=datetime.now()
    ))
    
    db.delete(member)
    db.commit()
    return {"message": "Member removed successfully"}

# 8. 활동 기록 조회
@router.get("/{project_id}/activity")
def get_project_activity(project_id: int, db: Session = Depends(get_db)):
    logs = (
        db.query(ProjectActivityLog, User.nickname)
        .join(User, ProjectActivityLog.actor_id == User.user_id)
        .filter(ProjectActivityLog.project_id == project_id)
        .order_by(ProjectActivityLog.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": log[0].id,
            "actor": log[1],
            "text": log[0].action,
            "date": log[0].created_at.strftime("%Y-%m-%d %H:%M:%S"),
        }
        for log in logs
    ]

# 9. 멤버 역할 업데이트
@router.patch("/{project_id}/members/{user_id}/roles")
def update_member_roles(
    project_id: int,
    user_id: int,
    payload: UpdateMemberRolesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_project_open(db, project_id)
    if current_user.user_id != user_id:
        raise HTTPException(status_code=403, detail="You can only update your own roles")

    member = db.query(ProjectMembers).filter(
        ProjectMembers.project_id == project_id,
        ProjectMembers.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    member.roles = payload.roles or []
    db.commit()
    db.refresh(member)
    return {"message": "Roles updated successfully", "roles": member.roles}

@router.post("/{project_id}/leave")
def leave_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ensure_project_open(db, project_id)
    member = db.query(ProjectMembers).filter(
        ProjectMembers.project_id == project_id,
        ProjectMembers.user_id == current_user.user_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Not a project member")

    if member.is_leader:
        # ✅ 팀장은 탈퇴 불가 (권한 이전 필요)
        raise HTTPException(status_code=403, detail="Leader cannot leave before transferring leadership")

    # 팀원 탈퇴 처리
    db.delete(member)
    db.add(ProjectActivityLog(
        project_id=project_id,
        actor_id=current_user.user_id,
        action=f"{current_user.nickname}이(가) 프로젝트에서 탈퇴함",
        created_at=datetime.now()
    ))
    db.commit()
    return {"message": "Left project successfully"}

@router.post("/{project_id}/close")
def close_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    leader = db.query(ProjectMembers).filter(
        ProjectMembers.project_id == project_id,
        ProjectMembers.user_id == current_user.user_id,
        ProjectMembers.is_leader == True
    ).first()
    if not leader:
        raise HTTPException(status_code=403, detail="Only leader can close")

    if project.is_closed:
        return {"message": "Already closed"}

    project.is_closed = True
    db.add(ProjectActivityLog(
        project_id=project_id,
        actor_id=current_user.user_id,
        action=f"{current_user.nickname}이(가) 프로젝트를 종료함",
        created_at=datetime.now()
    ))
    db.commit()
    return {"message": "Project closed"}