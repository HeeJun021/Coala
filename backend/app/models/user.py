from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, TIMESTAMP, Text, event
from sqlalchemy.orm import relationship, Session
from app.database import Base
from app.models.user_tier import UserTier
from sqlalchemy.sql import func  # ✅ TIMESTAMP 기본값을 위한 `func.now()` 추가

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)  # 자동 증가 ID
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=True)
    nickname = Column(String(50), unique=True, nullable=False)
    profile_image_url = Column(Text, default=None)
    bio = Column(Text, default=None)
    birth_date = Column(Date, default=None)
    rating = Column(Integer, default=1000)
    tier_id = Column(Integer, ForeignKey("user_tiers.tier_id"), default=1)  
    dailycheck = Column(Boolean, default=False)
    email_verified = Column(Boolean, default=False)
    
    created_at = Column(TIMESTAMP, server_default=func.now())  # ✅ `CURRENT_TIMESTAMP` → `func.now()`로 변경
    updated_at = Column(TIMESTAMP, default=func.now(), onupdate=func.now())  # ✅ 수정된 시간 자동 업데이트
    
     # 관계 설정
    tier = relationship("UserTier")  # User → UserTier 관계
    social_logins = relationship("SocialLogin", back_populates="user", cascade="all, delete")

# ✅ 자동으로 `tier_id` 업데이트
@event.listens_for(User, "before_update")
def update_tier_id(mapper, connection, target):
    session = Session.object_session(target)
    if target.rating is not None:
        new_tier = session.query(UserTier).filter(UserTier.min_rating <= target.rating).order_by(UserTier.min_rating.desc()).first()
        if new_tier:
            target.tier_id = new_tier.tier_id
