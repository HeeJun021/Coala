from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserSummary(BaseModel):
    user_id: int
    nickname: str
    email: str
    created_at: datetime
    post_count: int
    comment_count: int
    report_count: int
    tier_name: Optional[str] 

    class Config:
        from_attributes = True

class PostSummary(BaseModel):
    post_id: int
    title: str
    board_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class CommentSummary(BaseModel):
    comment_id: int
    content: str
    post_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserTierBase(BaseModel):
    tier_id: int
    tier_name: str
    min_rating: int

    class Config:
        from_attributes = True


class UserDetailResponse(BaseModel):
    user_id: int
    nickname: str
    email: str
    created_at: datetime
    tier: Optional[UserTierBase]
    report_count: int
    posts: List[PostSummary]
    comments: List[CommentSummary]

    class Config:
        from_attributes = True
