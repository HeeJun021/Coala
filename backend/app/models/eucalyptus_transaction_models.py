from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base  # ⬅️ 공통 Base

class EucalyptusTransaction(Base):
    __tablename__ = "eucalyptustransactions"

    transaction_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable = False)
    amount = Column(Integer, nullable=False)  # 획득은 +, 사용은 -
    action = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 관계 설정
    user = relationship("User", back_populates="eucalyptus_transactions")
