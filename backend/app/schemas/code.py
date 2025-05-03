# app/schemas/code.py
from pydantic import BaseModel
from typing import List

class TemplateFile(BaseModel):
    filename: str
    content: str
    language_id: int

class TemplateRequest(BaseModel):
    template_name: str
    files: List[TemplateFile]

class TemplateResponse(BaseModel):
    folder_id: int
    folder_name: str

class RenameRequest(BaseModel):
    item_id: int
    item_type: str  # "file" or "folder"
    new_name: str
    
class DeleteRequest(BaseModel):
    item_id: int
    item_type: str  # "file" or "folder"
