from sqlalchemy import Column, Integer, String
from app.database import Base

class UserTier(Base):
    __tablename__ = "user_tier"
    
    tier_id = Column(Integer, primary_key=True, autoincrement=True)
    tier_name = Column(String(50), unique=True, nullable=False)
    min_rating = Column(Integer, nullable=False)
    max_rating = Column(Integer, nullable=False)
