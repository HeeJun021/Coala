from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import date, datetime

# 위젯 타입 정의
class ProjectWidget(BaseModel):
    erd: bool = False
    git: bool = False
    docs: bool = False
    calendar: bool = False
    memo: bool = False
    tasks: bool = False
    board: bool = False
    timeline: bool = False
    files: bool = False
    templates: bool = False
    code_editor: bool = False
    
# 프로젝트 생성 요청
class ProjectCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    topic: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    widgets: ProjectWidget
    widget_order: List[str] = Field(default_factory=lambda: ["overview"])

    @field_validator("end_date")
    def _end_after_start(cls, v, values):
        sd = values.get("start_date")
        if v and sd and v < sd:
            raise ValueError("end_date must be on or after start_date")
        return v

# 프로젝트 수정 요청
class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    widgets: Optional[ProjectWidget] = None
    widget_order: Optional[List[str]] = None
    topic: Optional[str] = None
    tech_stack: Optional[List[str]] = None

# 프로젝트 생성 응답
class ProjectCreateResponse(BaseModel):
    project_id: int
    name: str
    description: Optional[str] = None
    topic: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    widgets: ProjectWidget
    widget_order: List[str]
    created_at: datetime

    class Config:
        from_attributes = True  # Pydantic v1: orm_mode=True 대체

# 단일 프로젝트 응답
class ProjectItem(BaseModel):
    project_id: int
    name: str
    description: Optional[str] = None
    topic: Optional[str] = None           
    tech_stack: Optional[List[str]] = None 
    progress: float
    start_date: Optional[date] = None     
    end_date: Optional[date] = None       
    widgets: ProjectWidget
    widget_order: List[str]
    created_at: datetime
    is_closed: bool = False
    leader_id: Optional[int] = None
    my_role: Optional[str] = None 
     
    class Config:
        from_attributes = True

# 내가 속한 프로젝트 리스트 응답
class MyProjectListResponse(BaseModel):
    projects: List[ProjectItem]

class UpdateMemberRolesRequest(BaseModel):
    roles: List[str]
