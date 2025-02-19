import uuid  # UUID 생성 모듈 추가
from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.user_tier import UserTier
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)  # UUID 적용
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True)
    email_verified = Column(Boolean, default=False)
    phone_number = Column(String(15), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    birth_date = Column(Date)
    rating = Column(Integer, default=0)
    status = Column(String(20), default="pending_verification")
    created_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")
    updated_at = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now) 
    tier_id = Column(Integer, ForeignKey("usertier.tier_id"))

    tier_id = Column(Integer, ForeignKey("user_tier.tier_id"), nullable=True)  
    tier = relationship("UserTier")  # 관계 정의