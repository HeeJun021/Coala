from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship
from app.database import Base

class SocialLogin(Base):
    __tablename__ = "social_logins"

    social_login_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    provider = Column(String(50), nullable=False)  # 제공자 (Google, Kakao, GitHub, Apple 등)
    provider_user_id = Column(String(255), unique=True, nullable=False)  # 제공자 내 유저 ID
    access_token = Column(String(255), nullable=True)  # GitHub 액세스 토큰 저장
    created_at = Column(TIMESTAMP, server_default=func.now())  # 생성일

    # User 모델과 관계 설정
    user = relationship("User", back_populates="social_logins")
