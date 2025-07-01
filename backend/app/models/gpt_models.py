from sqlalchemy import Column, Integer, Text, ForeignKey, TIMESTAMP, CheckConstraint, func
from sqlalchemy.orm import relationship
from app.database import Base

class GptSession(Base):
    __tablename__ = "gptsessions"

    session_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"))
    title = Column(Text, nullable=True)
    context = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # 클래스 이름 정확하게 사용
    messages = relationship("GptMessage", back_populates="session", cascade="all, delete-orphan")


class GptMessage(Base):
    __tablename__ = "gptmessages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("gptsessions.session_id", ondelete="CASCADE"))
    sender_type = Column(Text, CheckConstraint("sender_type IN ('user', 'assistant')"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # 클래스 이름 정확하게 사용
    session = relationship("GptSession", back_populates="messages")
