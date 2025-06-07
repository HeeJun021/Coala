from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# ✅ 위젯 타입 정의
class ProjectWidget(BaseModel):
    erd: bool = False
    git: bool = False
    docs: bool = False
    chat: bool = False
    calendar: bool = False
    memo: bool = False
    tasks: bool = False
    board: bool = False
    timeline: bool = False
    files: bool = False

# ✅ 프로젝트 생성 요청
class ProjectCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    widgets: ProjectWidget
    widget_order: Optional[List[str]] = ["overview"]

# ✅ 프로젝트 수정 요청
class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    widgets: Optional[ProjectWidget] = None
    widget_order: Optional[List[str]] = None
    topic: Optional[str] = None
    tech_stack: Optional[List[str]] = None

# ✅ 프로젝트 생성 응답
class ProjectCreateResponse(BaseModel):
    project_id: int
    name: str
    description: Optional[str] = None
    widgets: ProjectWidget
    widget_order: List[str]
    created_at: datetime

    class Config:
        from_attributes = True

# ✅ 단일 프로젝트 응답
class ProjectItem(BaseModel):
    project_id: int
    name: str
    description: Optional[str] = None
    progress: float
    widgets: ProjectWidget
    widget_order: List[str]
    created_at: datetime

    class Config:
        from_attributes = True

# ✅ 내가 속한 프로젝트 리스트 응답
class MyProjectListResponse(BaseModel):
    projects: List[ProjectItem]