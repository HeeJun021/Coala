from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..models.task_models import Tasks, TaskCollaborators
from ..schemas.task_schemas import TaskResponse, TaskCreate, TaskUpdate
from ..database import get_db
from ..dependencies.auth import get_current_user
from ..models.project_models import Project, ProjectMembers
from ..models.user import User

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("/my", response_model=List[TaskResponse])
async def get_my_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tasks = (
        db.query(Tasks)
        .join(Project, Tasks.project_id == Project.project_id)
        .join(ProjectMembers, Project.project_id == ProjectMembers.project_id)
        .filter(
            (Tasks.user_id == current_user.user_id) |
            (db.query(TaskCollaborators).filter(TaskCollaborators.user_id == current_user.user_id).exists())
        )
        .all()
    )
    for task in tasks:
        task.collaborators = (
            db.query(User)
            .join(TaskCollaborators, User.user_id == TaskCollaborators.user_id)
            .filter(TaskCollaborators.task_id == task.task_id)
            .all()
        )
        project = db.query(Project).filter(Project.project_id == task.project_id).first()
        task.project_name = project.name if project else None
    return tasks

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task_by_id(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Tasks).filter(Tasks.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if not (
        task.user_id == current_user.user_id or
        db.query(TaskCollaborators)
        .filter(
            TaskCollaborators.task_id == task_id,
            TaskCollaborators.user_id == current_user.user_id
        )
        .first()
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this task")
    task.collaborators = (
        db.query(User)
        .join(TaskCollaborators, User.user_id == TaskCollaborators.user_id)
        .filter(TaskCollaborators.task_id == task_id)
        .all()
    )
    project = db.query(Project).filter(Project.project_id == task.project_id).first()
    task.project_name = project.name if project else None
    return task

@router.post("", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.project_id == task_data.project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if not db.query(ProjectMembers).filter(
        ProjectMembers.project_id == task_data.project_id,
        ProjectMembers.user_id == current_user.user_id
    ).first():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a project member")
    new_task = Tasks(
        project_id=task_data.project_id,
        user_id=current_user.user_id,
        title=task_data.title,
        description=task_data.description,
        start_date=task_data.start_date,
        due_date=task_data.due_date,
        status=task_data.status or "예정",
        priority=task_data.priority or "보통"
    )
    db.add(new_task)
    db.flush()
    for user_id in task_data.collaborator_ids:
        if not db.query(ProjectMembers).filter(
            ProjectMembers.project_id == task_data.project_id,
            ProjectMembers.user_id == user_id
        ).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"User {user_id} is not a project member")
        collaborator = TaskCollaborators(task_id=new_task.task_id, user_id=user_id)
        db.add(collaborator)
    db.commit()
    db.refresh(new_task)
    new_task.collaborators = (
        db.query(User)
        .join(TaskCollaborators, User.user_id == TaskCollaborators.user_id)
        .filter(TaskCollaborators.task_id == new_task.task_id)
        .all()
    )
    project = db.query(Project).filter(Project.project_id == new_task.project_id).first()
    new_task.project_name = project.name if project else None
    return new_task

@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Tasks).filter(Tasks.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if task.user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this task")
    update_data = task_data.dict(exclude_unset=True)
    if "collaborator_ids" in update_data:
        db.query(TaskCollaborators).filter(TaskCollaborators.task_id == task_id).delete()
        for user_id in task_data.collaborator_ids:
            if not db.query(ProjectMembers).filter(
                ProjectMembers.project_id == task.project_id,
                ProjectMembers.user_id == user_id
            ).first():
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"User {user_id} is not a project member")
            collaborator = TaskCollaborators(task_id=task_id, user_id=user_id)
            db.add(collaborator)
        del update_data["collaborator_ids"]
    for key, value in update_data.items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    task.collaborators = (
        db.query(User)
        .join(TaskCollaborators, User.user_id == TaskCollaborators.user_id)
        .filter(TaskCollaborators.task_id == task_id)
        .all()
    )
    project = db.query(Project).filter(Project.project_id == task.project_id).first()
    task.project_name = project.name if project else None
    return task

@router.delete("/{task_id}", response_model=dict)
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Tasks).filter(Tasks.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if task.user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this task")
    db.delete(task)
    db.commit()
    return {"detail": "Task deleted"}