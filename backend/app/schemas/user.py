from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class UserBase(BaseModel):
    user_id: str
    username: str
    email: Optional[str]
    phone_number: str
    rating: int
    status: str
    tier_id: Optional[int]
    created_at: datetime
    updated_at: datetime

class UserUpdateSchema(BaseModel):
    username: str
    bio: str
    role: str

class UserResponse(UserBase):
    pass

# 요청 데이터를 처리할 경우 필요 시 추가 스키마 정의 가능
