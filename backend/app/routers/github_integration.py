from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.dependencies.auth import get_current_user
from app.schemas.github import RepoCreateRequest, RepoInfo
from app.services.github_service import create_repo_service

router = APIRouter(prefix="/project-git", tags=["Project Git"])

@router.post("/repos", response_model=RepoInfo)
def create_repo(
    body: RepoCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """GitHub에 새 리포지토리를 만들고 ProjectRepos/ProjectBranches 테이블에 기록"""
    return create_repo_service(db, current_user.user_id, body)
