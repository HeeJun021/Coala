from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional, List, Literal
from datetime import date, datetime


#   티어 정보 (내포용)
class UserTierBase(BaseModel):
    tier_id: int
    tier_name: str
    min_rating: int

    class Config:
        from_attributes = True


#   기본 유저 정보 스키마 (공통용)
class UserBase(BaseModel):
    user_id: int
    nickname: str
    profile_image_url: Optional[str] = None  # 기본 이미지 처리 필요
    email: Optional[str]
    rating: int
    tier_id: Optional[int] = 1
    dailycheck: bool
    bio: Optional[str] = None
    email_verified: bool
    created_at: datetime
    updated_at: datetime
    tier: Optional[UserTierBase]

    class Config:
        from_attributes = True


#   회원가입 요청용
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    nickname: str
    birth_date: Optional[date] = None


#   회원정보 응답용 (자세한 프로필)
class UserResponse(BaseModel):
    user_id: int
    email: str
    nickname: str
    profile_image_url: Optional[str] = None
    bio: Optional[str] = None
    birth_date: Optional[date]
    is_admin: bool
    rating: int
    tier_id: int
    email_verified: bool
    created_at: datetime
    updated_at: datetime
    tier: Optional[UserTierBase]
    skills: Optional[List[str]] = []

    class Config:
        from_attributes = True


#   사용자 정보 수정용
class UserUpdateSchema(BaseModel):
    nickname: str
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None


#   간단 정보 (팔로우 목록 등에서 사용)
class UserSimpleInfo(BaseModel):
    user_id: int
    nickname: str
    profile_image: Optional[str] = Field(alias="profile_image_url")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


#   프로필 이미지 변경 요청 (화폐 차감용)
class ProfileImageUpdateRequest(BaseModel):
    image_url: str
    action: Literal["change_profile_image"]  # 화폐 차감용
