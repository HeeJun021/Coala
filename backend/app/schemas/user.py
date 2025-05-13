from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional
from datetime import date, datetime


class UserTierBase(BaseModel):
    tier_id: int
    tier_name: str
    min_rating: int

    class Config:
        from_attributes = True  # 

# 기본 User 스키마
class UserBase(BaseModel):
    user_id: int
    nickname: str
    profile_image_url: Optional[str] # 나중에 기본 이미지 넣어야 함
    email: Optional[str]
    rating: int
    tier_id: Optional[int] = 1
    dailycheck: bool
    bio: Optional[str] = None # ✅ 자기소개 필드 추가
    email_verified: bool
    created_at: datetime
    updated_at: datetime
    tier: Optional[UserTierBase]


# 회원가입 요청 스키마
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    nickname: str
    birth_date: Optional[date] = None
    
# 회원가입 응답 스키마
class UserResponse(BaseModel):
    user_id: int
    email: str
    nickname: str
    profile_image_url: Optional[str]
    bio: Optional[str] = None
    birth_date: Optional[date]
    rating: int
    tier_id: int
    email_verified: bool
    created_at: str
    tier: Optional[UserTierBase]
    
    class Config:
        from_attributes = True

# 사용자 정보 수정용 스키마
class UserUpdateSchema(BaseModel):
    nickname: str
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    
    
class UserResponse(UserBase):
    pass

# 요청 데이터를 처리할 경우 필요 시 추가 스키마 정의 가능

# 팔로우 목록 조회를 위한 스키마
class UserSimpleInfo(BaseModel):
    user_id: int
    nickname: str
    profile_image: Optional[str] = Field(alias="profile_image_url")  # ✅ DB 컬럼명을 alias로

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)