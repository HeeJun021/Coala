from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

# --------------------------
#  코드 파일
# --------------------------

# 공통 필드 정의
class CodeBase(BaseModel):
    title: str
    content: str
    language_id: int

# 코드 생성 시 사용
class CodeCreate(CodeBase):
    folder_id: int

# 응답용
class CodeResponse(CodeBase):
    code_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CodeUpdate(BaseModel):
    content: str
    language_id: int
    
class CodeTitleUpdate(BaseModel):
    title: str

# --------------------------
#  코드 폴더
# --------------------------

class CodeFolderBase(BaseModel):
    folder_name: str
    parent_folder_id: Optional[int] = None

class CodeFolderCreate(CodeFolderBase):
    pass

class CodeFolderResponse(CodeFolderBase):
    folder_id: int
    user_id: int
    user_folder_index: int
    created_at: datetime

    class Config:
        from_attributes = True

class FolderRename(BaseModel):
    folder_name: str

# --------------------------
#  코드-폴더 매핑
# --------------------------

class CodeFolderMappingBase(BaseModel):
    folder_id: int
    code_id: int

class CodeFolderMappingCreate(CodeFolderMappingBase):
    pass

class CodeFolderMappingResponse(CodeFolderMappingBase):
    mapping_id: int
    updated_at: datetime

    class Config:
        from_attributes = True
