from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database import Base

class studymaterialreads(Base):
    __tablename__ = "studymaterialreads"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    material_id = Column(Integer, ForeignKey("study_materials.material_id"))  
    read_at = Column(DateTime(timezone=True), server_default=func.now())
