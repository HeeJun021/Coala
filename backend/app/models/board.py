from sqlalchemy import (Column, Integer, String, Text, ForeignKey, DateTime, CheckConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Post(Base):
    __tablename__ = 'posts'

    post_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete="CASCADE"))
    board_type = Column(String(20), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    code = Column(Text)
    image_url = Column(Text)
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    recruit_limit = Column(Integer, nullable=True)

    __table_args__ = (
        CheckConstraint("board_type IN ('free', 'code', 'project')", name="check_board_type"),
    )

    user = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete")
    applicants = relationship("ProjectApplicant", back_populates="post", cascade="all, delete")  # ✅ 추가


class Comment(Base):
    __tablename__ = 'comments'

    comment_id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey('posts.post_id', ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete="CASCADE"))
    parent_comment_id = Column(Integer, ForeignKey('comments.comment_id', ondelete="CASCADE"), nullable=True)
    content = Column(Text, nullable=False)
    like_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    post = relationship("Post", back_populates="comments")
    user = relationship("User")
    replies = relationship("Comment", remote_side=[comment_id])


class PostLike(Base):
    __tablename__ = 'post_likes'

    post_id = Column(Integer, ForeignKey('posts.post_id', ondelete="CASCADE"), primary_key=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete="CASCADE"), primary_key=True)


class CommentLike(Base):
    __tablename__ = 'comment_likes'

    comment_id = Column(Integer, ForeignKey('comments.comment_id', ondelete="CASCADE"), primary_key=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete="CASCADE"), primary_key=True)


class PostReport(Base):
    __tablename__ = 'post_reports'

    report_id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey('posts.post_id', ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete="CASCADE"))
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class CommentReport(Base):
    __tablename__ = 'comment_reports'

    report_id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey('comments.comment_id', ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete="CASCADE"))
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


# ✅ 프로젝트 게시판 참여 신청자 테이블 추가
class ProjectApplicant(Base):
    __tablename__ = "project_applicants"

    applicant_id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey('posts.post_id', ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete="CASCADE"))

    introduction = Column(Text, nullable=False)
    skills = Column(Text)  # 예: "JavaScript,React"
    links = Column(Text)
    status = Column(String(20), default="지원중")  # 수락됨, 거절됨 등
    applied_at = Column(DateTime, server_default=func.now())

    post = relationship("Post", back_populates="applicants")
    user = relationship("User")
