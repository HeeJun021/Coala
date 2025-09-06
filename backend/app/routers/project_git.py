from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Dict

from app.database import get_db
from app.models.user import User
from app.dependencies.auth import get_current_user

from app.schemas.github import RepoCreateRequest, RepoInfo, TreeResponse, BranchCreateRequest, BranchInfo, FileCreateRequest, StatusResponse, FileDeleteRequest, MergeBranchRequest, MergeResult

from app.services.project_git.github_service import create_repo_service
from app.services.project_git.git_browse_service import get_repo_tree, get_repo_file, get_connection_status, get_commit_history
from app.services.project_git.git_edit_service import save_file_to_buffer, stage_paths, commit_changes, create_new_file_service,  get_change_status, delete_file_service
from app.services.project_git.git_branch_service import create_branch_service, switch_branch_service, get_repo_info_service, list_branches_service, merge_branch_service

router = APIRouter(prefix="/project-git", tags=["Project Git"])

# ----------------------
# 1) 레포 생성
# ----------------------
@router.post("/repos", response_model=RepoInfo)
def create_repo(
    body: RepoCreateRequest,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    """
    GitHub에 새 리포지토리를 만들고
    project_repos / project_branches 매핑을 저장.
    """
    return create_repo_service(db, me.user_id, body)

# ----------------------
# 2) 트리 조회
# ----------------------
@router.get("/{project_id}/tree", response_model=TreeResponse)
def browse_tree(
    project_id: int,
    branch: Optional[str] = Query(None, description="미지정 시 default_branch"),
    base_path: str = Query("", description="이 경로 하위만"),
    recursive: bool = Query(True),
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    return get_repo_tree(db, me, project_id, branch, base_path, recursive)

# ----------------------
# 3) 파일 조회
# ----------------------
class FileData(BaseModel):
    branch: str
    path: str
    content: Optional[str] = None
    base_sha: Optional[str] = None
    is_staged: bool = False
    change_type: Optional[Literal["A","M","D"]] = None
    source: Literal["buffer","github"]
    encoding: Optional[Literal["utf-8","base64"]] = "utf-8"

@router.get("/{project_id}/file", response_model=FileData)
def read_file(
    project_id: int,
    path: str = Query(..., description="예: README.md"),
    branch: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    return get_repo_file(db, me, project_id, branch, path)

# ----------------------
# 4) 버퍼 저장
# ----------------------
class FileSaveRequest(BaseModel):
    branch: Optional[str] = None
    path: str
    content: str
    change_type: Optional[Literal["A","M","D"]] = None
    encoding: Optional[Literal["utf-8","base64"]] = "utf-8"
    expected_base_sha: Optional[str] = None

@router.put("/{project_id}/file")
def save_file(
    project_id: int,
    body: FileSaveRequest,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    res = save_file_to_buffer(
        db, me, project_id,
        body.branch, body.path, body.content,
        change_type=body.change_type,
        encoding=body.encoding,
        expected_base_sha=body.expected_base_sha,
    )

    return res

# ----------------------
# 5) 스테이징/언스테이징
# ----------------------
class StageRequest(BaseModel):
    branch: Optional[str] = None
    paths: List[str] = Field(..., min_items=1)
    staged: bool = True

@router.post("/{project_id}/stage")
def stage(
    project_id: int,
    body: StageRequest,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    return stage_paths(db, me, project_id, body.branch, body.paths, body.staged)

# ----------------------
# 6) 커밋(=푸시)
# ----------------------
class CommitRequest(BaseModel):
    branch: Optional[str] = None
    message: str
    useStagedOnly: bool = True
    paths: Optional[List[str]] = None
    expected_head_sha: Optional[str] = None 

@router.post("/{project_id}/commit")
def commit(
    project_id: int,
    body: CommitRequest,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    return commit_changes(
        db, me, project_id,
        body.branch, body.message,
        body.useStagedOnly, body.paths,
        expected_head_sha=body.expected_head_sha,
    )

# 브랜치 생성, 생성 후 바로 이동
@router.post("/{project_id}/branches", response_model=BranchInfo)
def create_branch(
    project_id: int,
    body: BranchCreateRequest,  # { "from_branch": null, "new_branch": "feature/x" }
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    res = create_branch_service(db, me, project_id, body.from_branch, body.new_branch)

    # 생성 직후 자동 전환
    switched = switch_branch_service(db, me, project_id, body.new_branch)
    return BranchInfo(branch_name=switched["branch_name"], head_sha=switched["head_sha"], is_protected=False)

# 브랜치 스위치(존재 확인 + 캐시 갱신, UI 전환용)
class SwitchBranchRequest(BaseModel):
    branch: str

@router.post("/{project_id}/branches/switch", response_model=BranchInfo)
def switch_branch(
    project_id: int,
    body: SwitchBranchRequest,  # { "branch": "feature/x" }
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    res = switch_branch_service(db, me, project_id, body.branch)
    return BranchInfo(branch_name=res["branch_name"], head_sha=res["head_sha"], is_protected=False)

#레포 정보 조회 -> default branch가 main인지 master인지
@router.get("/{project_id}/repo", response_model=RepoInfo)
def get_repo_info(
    project_id: int,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    return get_repo_info_service(db, project_id)

#브랜치 목록 조회 
@router.get("/{project_id}/branches", response_model=List[BranchInfo])
def list_branches(
    project_id: int,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    """프로젝트 레포의 브랜치 목록 조회"""
    return list_branches_service(db, me, project_id)

@router.post("/{project_id}/file", response_model=FileData)
def create_file(
    project_id: int,
    body: FileCreateRequest,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    """
    새 파일 '버퍼' 생성 (change_type='A').
    실제 GitHub 반영은 /stage → /commit 순으로 진행.
    """
    return create_new_file_service(db, me, project_id, body.branch, body.path, body.content)

# --- 상태 조회 ---
@router.get("/{project_id}/status", response_model=StatusResponse)
def get_status(
    project_id: int,
    branch: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    return get_change_status(db, me, project_id, branch)

# --- 파일 삭제 (DELETE) ---
@router.delete("/{project_id}/file")
def delete_file(
    project_id: int,
    body: FileDeleteRequest,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    return delete_file_service(db, me, project_id, body.branch, body.path)

@router.get(
    "/{project_id}/connection-status",
    summary="GitHub 저장소 연결 상태 확인",
    response_model=dict,
)
def get_repository_connection_status(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    프로젝트에 GitHub 저장소가 연결되어 있는지 확인합니다.
    """
    return get_connection_status(db, project_id)

@router.get(
    "/{project_id}/commits",
    summary="브랜치 커밋 내역 조회",
    response_model=List[Dict],
)
def get_branch_commit_history(
    project_id: int,
    branch: str, # 쿼리 파라미터로 브랜치 이름을 받음
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    선택된 브랜치의 최근 커밋 내역을 가져옵니다.
    """
    return get_commit_history(db, current_user, project_id, branch)

@router.post("/{project_id}/branches/merge", response_model=MergeResult)
def merge_branches(
    project_id: int,
    body: MergeBranchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    한 브랜치를 다른 브랜치로 병합(Merge)합니다.
    - head 브랜치를 base 브랜치로 병합합니다.
    """
    result = merge_branch_service(
        db=db,
        current_user=current_user,
        project_id=project_id,
        base=body.base,
        head=body.head,
        message=body.commit_message,
    )
    return result