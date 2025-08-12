from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# ===== 게시글 관련 =====
class PostBase(BaseModel):
    board_type: str
    title: str
    content: str
    code: Optional[str] = ""   
    image_url: Optional[str] = ""  
    user_id: int
    recruit_limit: Optional[int] = 1  

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):  # ✅ 게시글 수정용 모델 추가
    title: Optional[str] = None
    content: Optional[str] = None
    code: Optional[str] = ""
    image_url: Optional[str] = ""
    recruit_limit: Optional[int] = None
    code_filename: Optional[str] = ""
    code_language: Optional[str] = ""

class PostResponse(PostBase):
    post_id: int
    view_count: int
    like_count: int
    comment_count: int
    created_at: datetime
    updated_at: datetime
    author_nickname: Optional[str] = None
    accepted_count: Optional[int] = 1 

    model_config = {"from_attributes": True}

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
    nickname: Optional[str] = None   

    model_config = {"from_attributes": True}

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

# ======= 프로젝트 보드 관련 ========
class ProjectApplicantCreate(BaseModel):
    user_id: int
    introduction: str
    skills: List[str]
    links: Optional[str] = None

class ProjectApplicantResponse(BaseModel):
    applicant_id: int
    user_id: int
    nickname: str
    introduction: str
    skills: List[str]
    links: Optional[str]
    status: str
    applied_at: datetime

    class Config:
        from_attributes = True
