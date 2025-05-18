from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# ✅ 위젯 타입 정의
class ProjectWidget(BaseModel):
    erd: bool = False
    git: bool = False
    memo: bool = False
    calendar: bool = False

# ✅ 프로젝트 생성 요청
class ProjectCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    widgets: ProjectWidget

# ✅ 프로젝트 생성 응답
class ProjectCreateResponse(BaseModel):
    project_id: int
    name: str
    description: Optional[str] = None
    widgets: ProjectWidget
    created_at: datetime

    class Config:
        from_attributes = True


# ✅ 단일 프로젝트 응답
class ProjectItem(BaseModel):
    project_id: int
    name: str
    description: Optional[str] = None
    progress: int
    widgets: ProjectWidget
    created_at: datetime

    class Config:
        from_attributes = True

# ✅ 내가 속한 프로젝트 리스트 응답
class MyProjectListResponse(BaseModel):
    projects: List[ProjectItem]