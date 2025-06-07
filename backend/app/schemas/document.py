from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DocumentBase(BaseModel):
    title: Optional[str] = "새 문서"
    content: Optional[str] = ""

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    doc_id: int
    updated_at: datetime

    class Config:
        orm_mode = True
