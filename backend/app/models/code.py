from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship
from app.database import Base

class Code(Base):
    __tablename__ = "codes"

    code_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    language_id = Column(Integer, ForeignKey("languages.language_id"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

class CodeFolder(Base):
    __tablename__ = "code_folders"

    folder_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    user_folder_index = Column(Integer, nullable=False)
    folder_name = Column(String(255), nullable=False)
    parent_folder_id = Column(Integer, ForeignKey("code_folders.folder_id", ondelete="CASCADE"), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

class CodeFolderMapping(Base):
    __tablename__ = "code_folder_mapping"

    mapping_id = Column(Integer, primary_key=True, index=True)
    folder_id = Column(Integer, ForeignKey("code_folders.folder_id", ondelete="CASCADE"), nullable=False)
    code_id = Column(Integer, ForeignKey("codes.code_id", ondelete="CASCADE"), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())