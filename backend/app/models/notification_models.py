from sqlalchemy import Column, BigInteger, String, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    
    sender_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    
    type = Column(String(50), nullable=False)        # 예: 'project_invite'
    content = Column(Text, nullable=False)
    link_url = Column(String(255), nullable=True)
    
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
