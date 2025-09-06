from __future__ import annotations
from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from .common import ShaStr, BranchStr, NameStr

# ----- Repo -----
class RepoCreateRequest(BaseModel):
    project_id: int = Field(..., ge=1)
    name: NameStr
    private: bool = True
    description: Optional[str] = None

class RepoInfo(BaseModel):
    project_repo_id: int
    owner: str
    repo_name: str
    default_branch: BranchStr

# ----- Branch -----
class BranchCreateRequest(BaseModel):
    from_branch: BranchStr | None = None
    new_branch: BranchStr

class BranchInfo(BaseModel):
    branch_name: BranchStr
    head_sha: Optional[ShaStr] = None
    is_protected: bool = False

# ----- Tree (for UI) -----
class TreeItem(BaseModel):
    path: str
    type: Literal["blob", "tree"]
    size: Optional[int] = None
    sha: Optional[ShaStr] = None

class TreeResponse(BaseModel):
    branch: BranchStr
    recursive: bool = True
    items: List[TreeItem]

class FileCreateRequest(BaseModel):
    branch: Optional[str] = None
    path: str
    content: str = ""
    
class StatusResponse(BaseModel):
    branch: str
    staged: List[str] = []
    unstaged: List[str] = []
    has_uncommitted: bool = False

class FileUpdateRequest(BaseModel):
    branch: Optional[str] = None
    path: str
    content: str

class FileDeleteRequest(BaseModel):
    branch: Optional[str] = None
    path: str
    
# --- 요청 모델 ---
class MergeBranchRequest(BaseModel):
    base: str  # 병합의 대상이 되는 브랜치 (예: "main")
    head: str  # 병합할 브랜치 (예: "feature/login")
    commit_message: Optional[str] = None

# --- 응답 모델 ---
class MergeResult(BaseModel):
    sha: str
    message: str
    author_name: str
    merged: bool
    details: str