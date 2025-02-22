import uuid  # UUID 생성 모듈 추가
from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, TIMESTAMP, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.user_tier import UserTier
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)  # 자동 증가 ID
    email = Column(String(255), unique=True, nullable=False)
    password = Column(Text, nullable=True)  # 간편 로그인 사용자는 NULL 허용
    nickname = Column(String(50), unique=True, nullable=False)
    profile_image_url = Column(Text, default=None)
    bio = Column(Text, default=None)
    birth_date = Column(Date, default=None)
    rating = Column(Integer, default=1000)
    tier_id = Column(Integer, ForeignKey("user_tiers.tier_id"), default=1)  
    dailycheck = Column(Boolean, default=False)
    email_verified = Column(Boolean, default=False)
    password = Column(String(255), nullable=False)
    rating = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")
    updated_at = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)
    
     # 관계 설정
    tier = relationship("UserTier")  # User → UserTier 관계