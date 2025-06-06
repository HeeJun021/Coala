from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.schemas.project_schemas import ProjectCreateRequest, ProjectUpdateRequest
from app.models.project_models import Project, ProjectMembers, ProjectWidgets, ProjectActivityLog
from datetime import datetime
from app.models.user import User

router = APIRouter(prefix="/projects", tags=["Projects"])

# ✅ 1. 내 프로젝트 목록 조회
@router.get("/my")
def get_my_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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
            "topic": p.topic,  # ✅ 이거 추가!
            "tech_stack": p.tech_stack,  # ✅ 이거도 추가!
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

# ✅ 2. 프로젝트 팀원 목록 조회
@router.get("/{project_id}/members")
def get_project_members(project_id: int, db: Session = Depends(get_db)):
    members = (
        db.query(User, ProjectMembers.is_leader, ProjectMembers.status)
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
            "status": m[2],  # ✅ 추가
        }
        for m in members
    ]


# ✅ 3. 프로젝트 생성
@router.post("")
def create_project(
    project_data: ProjectCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_project = Project(
        name=project_data.name,
        description=project_data.description,
        widget_order=project_data.widget_order,
    )
    db.add(new_project)
    db.flush()

    # 팀 리더 등록
    member = ProjectMembers(
        project_id=new_project.project_id,
        user_id=current_user.user_id,
        is_leader=True,
        status="accepted"  # ✅ 추가
    )
    db.add(member)

    # 위젯 저장
    for widget_type, enabled in project_data.widgets.dict().items():
        if enabled:
            db.add(ProjectWidgets(project_id=new_project.project_id, widget_type=widget_type))

    # 활동 기록 추가
    db.add(ProjectActivityLog(
        project_id=new_project.project_id,
        actor_id=current_user.user_id,
        action=f"{current_user.nickname}이(가) 프로젝트를 생성함",
        created_at=datetime.now()
    ))

    db.commit()
    return {
        "project_id": new_project.project_id,
        "name": new_project.name,
        "description": new_project.description,
        "widgets": project_data.widgets,
        "widget_order": new_project.widget_order,
        "created_at": new_project.created_at
    }

# ✅ 4. 프로젝트 수정
@router.patch("/{project_id}")
def update_project(
    project_id: int,
    project_data: ProjectUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 팀원 확인 (현재는 리더만 수정 가능으로 제한)
    member = db.query(ProjectMembers).filter(
        ProjectMembers.project_id == project_id,
        ProjectMembers.user_id == current_user.user_id,
        ProjectMembers.is_leader == True
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Only leader can update project")

    # 프로젝트 정보 업데이트
    if project_data.name:
        project.name = project_data.name
    if project_data.description is not None:
        project.description = project_data.description
    if project_data.widget_order is not None:
        project.widget_order = project_data.widget_order
    if project_data.topic is not None:
        project.topic = project_data.topic
    if project_data.tech_stack is not None:
        project.tech_stack = project_data.tech_stack

    # 위젯 업데이트
    if project_data.widgets is not None:
        db.query(ProjectWidgets).filter(ProjectWidgets.project_id == project_id).delete()
        for widget_type, enabled in project_data.widgets.dict().items():
            if enabled:
                db.add(ProjectWidgets(project_id=project_id, widget_type=widget_type))

    # 활동 기록 추가
    db.add(ProjectActivityLog(
        project_id=project_id,
        actor_id=current_user.user_id,
        action=f"{current_user.nickname}이(가) 프로젝트 정보를 업데이트함",
        created_at=datetime.now()
    ))

    db.commit()
    return {"message": "Project updated successfully"}

# ✅ 5. 멤버 추가
@router.post("/{project_id}/members")
def add_project_member(
    project_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 리더만 멤버 추가 가능
    member = db.query(ProjectMembers).filter(
        ProjectMembers.project_id == project_id,
        ProjectMembers.user_id == current_user.user_id,
        ProjectMembers.is_leader == True
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Only leader can add members")

    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required")

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 이미 멤버인지 확인
    existing_member = db.query(ProjectMembers).filter(
        ProjectMembers.project_id == project_id,
        ProjectMembers.user_id == user_id
    ).first()
    if existing_member:
        raise HTTPException(status_code=400, detail="User is already a member")

    new_member = ProjectMembers(
        project_id=project_id,
        user_id=user_id,
        is_leader=False
    )
    db.add(new_member)

    # 활동 기록 추가
    db.add(ProjectActivityLog(
        project_id=project_id,
        actor_id=current_user.user_id,
        action=f"{current_user.nickname}이(가) {user.nickname}을(를) 팀에 추가함",
        created_at=datetime.now()
    ))

    db.commit()
    return {"message": "Member added successfully"}

# ✅ 6. 멤버 방출
@router.delete("/{project_id}/members/{user_id}")
def remove_project_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 리더만 멤버 방출 가능
    member = db.query(ProjectMembers).filter(
        ProjectMembers.project_id == project_id,
        ProjectMembers.user_id == current_user.user_id,
        ProjectMembers.is_leader == True
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Only leader can remove members")

    # 방출 대상 확인
    target_member = db.query(ProjectMembers).filter(
        ProjectMembers.project_id == project_id,
        ProjectMembers.user_id == user_id
    ).first()
    if not target_member:
        raise HTTPException(status_code=404, detail="Member not found")

    if target_member.is_leader:
        raise HTTPException(status_code=400, detail="Cannot remove the leader")

    user = db.query(User).filter(User.user_id == user_id).first()
    db.delete(target_member)

    # 활동 기록 추가
    db.add(ProjectActivityLog(
        project_id=project_id,
        actor_id=current_user.user_id,
        action=f"{current_user.nickname}이(가) {user.nickname}을(를) 팀에서 방출함",
        created_at=datetime.now()
    ))

    db.commit()
    return {"message": "Member removed successfully"}

# ✅ 7. 팀장 권한 이전
@router.post("/{project_id}/transfer-leader")
def transfer_leader(
    project_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 현재 리더 확인
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

    # 새 리더가 프로젝트 멤버인지 확인
    new_leader = db.query(ProjectMembers).filter(
        ProjectMembers.project_id == project_id,
        ProjectMembers.user_id == new_leader_id
    ).first()
    if not new_leader:
        raise HTTPException(status_code=404, detail="New leader not found in project")

    # 기존 리더의 is_leader를 False로 변경
    current_leader.is_leader = False
    # 새 리더의 is_leader를 True로 변경
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

# ✅ 8. 활동 기록 조회
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