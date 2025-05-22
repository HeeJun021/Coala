from pydantic import BaseModel
from typing import Optional

class ErdCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ErdResponse(BaseModel):
    erd_id: int
    project_id: int
    name: str
    description: Optional[str]
    created_at: str  # ✅ datetime → str로 포맷된 형태 받음
    updated_at: Optional[str]
    last_editor_name: Optional[str]
    table_count: int

    class Config:
        from_attributes = True
