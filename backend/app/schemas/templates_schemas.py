# app/schemas/templates_schemas.py
from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

# ===== 프로젝트 템플릿(인스턴스) =====
class ProjectTemplateCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    widgets: Optional[List[str]] = None

class ProjectTemplateUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    widgets: Optional[List[str]] = None
    applied_blocks: Optional[Any] = None   # ✅ 추가


class ProjectTemplateResponse(BaseModel):
    template_id: int
    title: str
    description: Optional[str] = None
    widgets: Optional[List[str]] = None
    applied_blocks: Optional[Any] = None
    library_id: Optional[int] = None
    added_at: datetime

    class Config:
        from_attributes = True

# ===== 전역 라이브러리 =====
class TemplateLibraryCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    blocks: Any
    thumbnail_url: Optional[str] = None
    version: Optional[int] = 1
    is_published: Optional[bool] = True

class TemplateLibraryResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    blocks: Any
    thumbnail_url: Optional[str] = None
    version: int
    is_published: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ===== 전역 라이브러리 → 프로젝트 적용 요청 =====
class ApplyFromLibraryRequest(BaseModel):
    library_id: int
