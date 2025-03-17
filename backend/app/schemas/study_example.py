from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any

class StudyExampleResponse(BaseModel):
    example_id: int
    language_id: int
    title: str
    content: str
    sections: Optional[List[Dict[str, Any]]] = None  # ✅ JSON 필드 추가
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # ✅ Pydantic v2에서는 orm_mode 대신 사용
