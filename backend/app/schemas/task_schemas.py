from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    status: Optional[str] = "예정"
    priority: Optional[str] = "보통"
    project_id: int

class TaskCreate(TaskBase):
    collaborator_ids: List[int] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    collaborator_ids: Optional[List[int]] = None

class UserResponse(BaseModel):
    user_id: int
    nickname: str

    class Config:
        from_attributes = True

class TaskResponse(TaskBase):
    task_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    collaborators: List[UserResponse] = []
    project_name: str

    class Config:
        from_attributes = True