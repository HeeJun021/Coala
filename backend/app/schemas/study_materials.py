from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class StudyMaterialResponse(BaseModel):
    material_id: int
    language_id: int
    title: str
    content: str
    file_url: Optional[str] = None
    sections: List[dict] | None = None  # ✅ JSON 필드 수정 (더 명확한 타입)

    class Config:
        from_attributes = True  # ✅ Pydantic v2에서 orm_mode 대신 사용
