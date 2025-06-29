from pydantic import BaseModel
from typing import Optional, Literal, List
from datetime import datetime


# ===== 공통 =====
class GptMessageBase(BaseModel):
    sender_type: Literal["user", "assistant"]
    content: str


# ===== 메시지 생성 요청 =====
class GptMessageCreate(BaseModel):
    message: str  # 사용자가 입력한 메시지


# ===== 세션 생성 요청 =====
class GptSessionCreate(BaseModel):
    context: str
    message: str  # 첫 질문


# ===== 메시지 응답 =====
class GptMessageResponse(GptMessageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True  # ✅ Pydantic v2 방식


# ===== 세션 리스트 조회 응답 =====
class GptSessionListItem(BaseModel):
    session_id: int
    title: Optional[str]
    context: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # ✅


# ===== 세션 상세 조회 (메시지 포함) =====
class GptSessionDetail(BaseModel):
    session_id: int
    title: Optional[str]
    context: str
    created_at: datetime
    updated_at: datetime
    messages: List[GptMessageResponse]

    class Config:
        from_attributes = True  # ✅


# ===== GPT 응답 본문 (단일 메시지) =====
class GptSingleResponse(BaseModel):
    session_id: int
    response: str


# 🔧 세션 제목 수정 요청 스키마
class GptSessionUpdateTitle(BaseModel):
    title: str
