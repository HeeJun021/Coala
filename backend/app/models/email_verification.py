from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from app.database import Base

class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"

    token_id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)  # user_id 대신 이메일 직접 저장
    token = Column(String, unique=True, nullable=False)
    expires_at = Column(TIMESTAMP, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
