from pydantic import BaseModel, EmailStr
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

class UserCreate(BaseModel):  # 회원가입에 필요한 필드만 포함
    username: str
    email: EmailStr
    password: str  # 패스워드는 DB 저장 시 해싱할 것
    phone_number: str
    birth_date: date

class UserUpdateSchema(BaseModel):
    username: str
    bio: str
    role: str
    
    

class UserResponse(UserBase):
    pass

# 요청 데이터를 처리할 경우 필요 시 추가 스키마 정의 가능
