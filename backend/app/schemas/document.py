from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# 🔹 공통 필드 (title, content)
class DocumentBase(BaseModel):
    title: str = "새 문서"
    content: str = ""

# 🔹 생성 시: 기본값 허용
class DocumentCreate(DocumentBase):
    pass

# 🔹 수정 시: 일부만 수정 가능하도록 Optional
class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

# 🔹 응답용: 전체 필드 + 타임스탬프 포함
class DocumentResponse(DocumentBase):
    doc_id: int
    project_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
