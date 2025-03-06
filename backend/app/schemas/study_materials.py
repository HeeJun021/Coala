from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class StudyMaterialsResponse(BaseModel):
    material_id: int
    language_id: int
    title: str
    content: str
    file_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
