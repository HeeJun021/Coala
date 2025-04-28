from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# ===== 게시글 관련 =====
class PostBase(BaseModel):
    board_type: str  # 'free', 'code', 'project'
    title: str
    content: str
    code: Optional[str] = None
    image_url: Optional[str] = None
    user_id: int

class PostCreate(PostBase):
    pass

class PostResponse(PostBase):
    post_id: int
    view_count: int
    like_count: int
    comment_count: int
    created_at: datetime
    updated_at: datetime
    author_nickname: Optional[str] = None  # ✅ 작성자 닉네임 추가

    model_config = {
        "from_attributes": True
    }

# ===== 댓글 관련 =====
class CommentBase(BaseModel):
    user_id: int
    content: str
    parent_comment_id: Optional[int] = None

class CommentCreate(CommentBase):
    pass

class CommentResponse(CommentBase):
    comment_id: int
    like_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True  # ✅ v2 기준 적용
    }

# ===== 좋아요 관련 =====
class PostLikeCreate(BaseModel):
    post_id: int
    user_id: int

class CommentLikeCreate(BaseModel):
    comment_id: int
    user_id: int

# ===== 신고 관련 =====
class PostReportCreate(BaseModel):
    post_id: int
    user_id: int
    reason: str

class CommentReportCreate(BaseModel):
    comment_id: int
    user_id: int
    reason: str