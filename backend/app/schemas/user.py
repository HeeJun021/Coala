from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime

# 기본 User 스키마
class UserBase(BaseModel):
    user_id: str
    username: str
    email: Optional[str]
    rating: int
    tier_id: Optional[int] = 1
    dailycheck: bool
    email_verified: bool
    created_at: datetime
    updated_at: datetime

class UserCreate(BaseModel):  # 회원가입에 필요한 필드만 포함
    username: str
    email: EmailStr
    password: str  # 패스워드는 DB 저장 시 해싱할 것

# 사용자 정보 수정용 스키마
class UserUpdateSchema(BaseModel):
    nickname: str
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    
    

class UserResponse(UserBase):
    pass

# 요청 데이터를 처리할 경우 필요 시 추가 스키마 정의 가능
