from __future__ import annotations
import requests
from typing import Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.project_git.project_repo import ProjectRepo
from app.models.project_git.project_branch import ProjectBranch
from app.models.social_login import SocialLogin
from app.schemas.github import RepoCreateRequest, RepoInfo 

GITHUB_API = "https://api.github.com"

def _get_github_token(db: Session, user_id: int) -> str:
    sl = (
        db.query(SocialLogin)
        .filter(SocialLogin.user_id == user_id, SocialLogin.provider == "github")
        .first()
    )
    if not sl or not sl.access_token:
        raise HTTPException(status_code=401, detail="GitHub 계정이 연동되지 않았습니다.")
    return sl.access_token

def _gh_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}

def create_repo_service(db: Session, user_id: int, body: RepoCreateRequest) -> RepoInfo:
    """
    개인 레포 생성만 수행 (/user/repos).
    스키마에 owner_override가 없으므로 조직 생성 분기는 제거.
    """
    token = _get_github_token(db, user_id)
    headers = _gh_headers(token)

    payload = {
        "name": body.name,
        "description": body.description or "",
        "private": body.private,
        "auto_init": True,
    }

    # 개인 레포 생성 엔드포인트
    url = f"{GITHUB_API}/user/repos"

    resp = requests.post(url, headers=headers, json=payload)
    if resp.status_code != 201:
        # 가능한 메시지를 최대한 전달
        try:
            j = resp.json()
        except Exception:
            j = {}
        msg = j.get("message") or resp.text
        errors = j.get("errors")
        doc_url = j.get("documentation_url")

        if resp.status_code == 401:
            raise HTTPException(status_code=401, detail=f"GitHub 토큰 오류: {msg}")
        if resp.status_code == 403:
            raise HTTPException(status_code=403, detail=f"GitHub 권한 부족(403): {msg}")
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"GitHub API 오류: {msg}, errors={errors}, doc={doc_url}",
        )

    data = resp.json()
    owner = data["owner"]["login"]
    repo_name = data["name"]
    default_branch = data.get("default_branch", "main")

    # DB: ProjectRepos
    repo = ProjectRepo(
        project_id=body.project_id,
        provider="github",
        owner=owner,
        repo_name=repo_name,
        default_branch=default_branch,
    )
    db.add(repo)
    db.flush()  # project_repo_id 확보

    # 기본 브랜치 HEAD 캐시
    head_sha: Optional[str] = None
    ref = requests.get(
        f"{GITHUB_API}/repos/{owner}/{repo_name}/git/ref/heads/{default_branch}",
        headers=headers,
    )
    if ref.status_code == 200:
        head_sha = (ref.json().get("object") or {}).get("sha")

    db.add(
        ProjectBranch(
            project_repo_id=repo.project_repo_id,
            branch_name=default_branch,
            head_sha=head_sha,
            is_protected=False,
        )
    )
    db.commit()
    db.refresh(repo)

    return RepoInfo(
        project_repo_id=repo.project_repo_id,
        owner=owner,
        repo_name=repo_name,
        default_branch=default_branch,
    )
