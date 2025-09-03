from __future__ import annotations
from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from .common import ShaStr, BranchStr, MsgStr

ChangeType = Literal["A", "M", "D"]  # Added / Modified / Deleted
SourceType  = Literal["buffer", "github"]

# --------- File Get / Save ----------
class FileData(BaseModel):
    branch: BranchStr
    path: str
    content: Optional[str] = None
    base_sha: Optional[ShaStr] = None
    is_staged: bool = False
    change_type: Optional[ChangeType] = None
    source: SourceType  # 디버그/표시용

class FileSaveRequest(BaseModel):
    branch: BranchStr
    path: str
    content: str
    change_type: Optional[ChangeType] = None  # 신규/삭제 표기 미리 둘 수도 있음

# --------- Stage / Unstage ----------
class StageRequest(BaseModel):
    branch: BranchStr
    paths: List[str] = Field(..., min_items=1)
    staged: bool = True

class StageResult(BaseModel):
    branch: BranchStr
    staged: List[str] = []
    unstaged: List[str] = []

# --------- Commit ----------
class CommitRequest(BaseModel):
    branch: BranchStr
    message: MsgStr
    useStagedOnly: bool = True
    paths: Optional[List[str]] = None  # 특정 파일만 커밋하고 싶을 때

class CommitResult(BaseModel):
    branch: BranchStr
    commit_sha: ShaStr

# --------- File Locks ----------
class LockCreateRequest(BaseModel):
    branch: BranchStr
    path: str

class LockInfo(BaseModel):
    branch: BranchStr
    path: str
    locked_by: int
    locked_at: str  # ISO string (DB에서 그대로 직렬화)

# --------- Switch Branch (UI 전환) ----------
class SwitchBranchRequest(BaseModel):
    branch: BranchStr
