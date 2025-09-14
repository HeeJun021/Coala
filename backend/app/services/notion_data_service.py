# 프로젝트/작업/사용자 정보를 DB에서 모아 DTO(KV)로 변환
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.models.user import User
from app.models.project_models import Project
from app.models.project_models import ProjectMembers
from app.models.task_models import Tasks
from app.models.task_models import TaskCollaborators

def _join_names(users: List[User]) -> str:
    def name(u: User):
        return u.nickname or u.email or f"User#{u.user_id}"
    return ", ".join([name(u) for u in users])

def load_project_kv(db: Session, project_id: int) -> Dict[str, Any]:
    # 1) 프로젝트 기본
    project: Project | None = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        return {}

    # 2) 팀원 (리더/팀원)
    pm_rows: List[ProjectMembers] = (
        db.query(ProjectMembers)
        .filter(ProjectMembers.project_id == project_id)
        .all()
    )
    user_ids = [r.user_id for r in pm_rows]
    users = db.query(User).filter(User.user_id.in_(user_ids)).all()

    # 3) 작업과 협업자
    task_rows: List[Tasks] = (
        db.query(Tasks)
        .filter(Tasks.project_id == project_id)
        .order_by(Tasks.start_date.asc().nulls_last())
        .all()
    )
    # 각 작업의 협업자
    task_id_list = [t.task_id for t in task_rows] or [-1]
    tc_rows: List[TaskCollaborators] = (
        db.query(TaskCollaborators)
        .filter(TaskCollaborators.task_id.in_(task_id_list))
        .all()
    )
    # task_id -> [User]
    collab_user_ids_map: Dict[int, List[int]] = {}
    for tc in tc_rows:
        collab_user_ids_map.setdefault(tc.task_id, []).append(tc.user_id)

    collab_users_map: Dict[int, List[User]] = {}
    if tc_rows:
        collab_users = db.query(User).filter(User.user_id.in_({u for ids in collab_user_ids_map.values() for u in ids})).all()
        by_id = {u.user_id: u for u in collab_users}
        for tid, uid_list in collab_user_ids_map.items():
            collab_users_map[tid] = [by_id.get(uid) for uid in uid_list if by_id.get(uid)]

    # 기술스택/주제 등 (Projects 스키마에 맞춰 필드명 조정)
    tech_stack = getattr(project, "tech_stack", None)
    topic = getattr(project, "topic", None)

    # 상태 계산: is_closed 또는 날짜로
    is_closed = bool(getattr(project, "is_closed", False))
    status_text = "종료" if is_closed else "진행중"

    # 작업 요약 문자열
    tasks_summary_lines = []
    for t in task_rows:
        collab_names = _join_names(collab_users_map.get(t.task_id, []))
        creator = None
        if getattr(t, "creator_id", None):
            creator = db.query(User).filter(User.user_id == t.creator_id).first()
        creator_name = creator.nickname if (creator and creator.nickname) else (creator.email if creator else "")
        tasks_summary_lines.append(
            f"- {t.title or '작업'} | 시작:{t.start_date or '-'} 마감:{t.due_date or '-'} | 생성자:{creator_name or '-'} | 협업자:{collab_names or '-'}"
        )
    tasks_summary = "\n".join(tasks_summary_lines) if tasks_summary_lines else ""

    # 사용자 대표 정보 (리더 우선)
    leaders = [u for (u, m) in ((next((x for x in users if x.user_id == row.user_id), None), row) for row in pm_rows) if m and m.is_leader and u]
    leader_names = _join_names(leaders) if leaders else ""
    all_member_names = _join_names(users) if users else ""

    # 임시 이메일은 리더 1명 우선, 없으면 첫 사용자
    primary_user = leaders[0] if leaders else (users[0] if users else None)
    user_email = primary_user.email if primary_user else ""
    user_name = primary_user.nickname or primary_user.email if primary_user else ""

    kv: Dict[str, Any] = {
        # 개요
        "project_name": project.name,
        "project_role": leader_names or "작성 필요",
        "project_description": getattr(project, "description", None),
        "topic": topic,
        "tech_stack": tech_stack,
        # 상태
        "status": status_text,
        "is_closed": "true" if is_closed else "false",
        "start_date": str(getattr(project, "start_date", "") or ""),
        "end_date": str(getattr(project, "end_date", "") or ""),
        # 작업
        "tasks_summary": tasks_summary,
        # 사용자(대표)
        "user_name": user_name,
        "user_email": user_email,
        # 보조
        "members": all_member_names,
        "leaders": leader_names,
    }
    return kv
