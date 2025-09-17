from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database import Base  # 네 프로젝트의 Base

class UserPortfolioProfile(Base):
    __tablename__ = "user_portfolio_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, unique=True)
    full_name = Column(String(100))
    birth_date = Column(Date)
    phone = Column(String(50))
    email = Column(String(255))
    education = Column(JSONB, nullable=False, server_default="[]")  # [{school, major, period, desc}]
    career = Column(JSONB, nullable=False, server_default="[]")     # [{company, role, period, desc}]
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    user = relationship("User", backref="portfolio_profile")
