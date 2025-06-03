from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

class Block(BaseModel):
    id: int
    type: str
    text: str
    styles: Dict

class MemoCreate(BaseModel):
    blocks: List[Block]

class MemoUpdate(BaseModel):
    blocks: Optional[List[Block]] = None

class MemoResponse(BaseModel):
    memo_id: int
    user_id: int
    blocks: List[Block]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True