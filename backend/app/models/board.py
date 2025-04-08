from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, CheckConstraint
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

    __table_args__ = (
        CheckConstraint("board_type IN ('free', 'code', 'project')", name="check_board_type"),
    )

    user = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete")


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
