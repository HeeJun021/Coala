from __future__ import annotations
from typing import Tuple, Optional, Dict, List

import requests
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.project_git.project_repo import ProjectRepo
from app.models.project_git.project_branch import ProjectBranch
from app.schemas.github import RepoInfo
from app.services.project_git.github_service import _get_github_token, _gh_headers, GITHUB_API

# 공통 컨텍스트
def _get_repo_context(db: Session, project_id: int) -> Tuple[int, str, str, str]:
    repo = (
        db.query(ProjectRepo)
        .filter(ProjectRepo.project_id == project_id, ProjectRepo.provider == "github")
        .first()
    )
    if not repo:
        raise HTTPException(status_code=404, detail="프로젝트에 연결된 GitHub 레포가 없습니다.")
    return repo.project_repo_id, repo.owner, repo.repo_name, repo.default_branch

def _get_branch_head(owner: str, repo: str, branch: str, token: str) -> Optional[str]:
    r = requests.get(
        f"{GITHUB_API}/repos/{owner}/{repo}/git/ref/heads/{branch}",
        headers=_gh_headers(token),
    )
    if r.status_code == 200:
        return (r.json().get("object") or {}).get("sha")
    if r.status_code == 404:
        return None
    raise HTTPException(status_code=r.status_code, detail=f"브랜치 조회 실패: {r.text}")

def get_repo_info_service(db: Session, project_id: int) -> RepoInfo:
    repo = (
        db.query(ProjectRepo)
        .filter(ProjectRepo.project_id == project_id, ProjectRepo.provider == "github")
        .first()
    )
    if not repo:
        raise HTTPException(status_code=404, detail="프로젝트에 연결된 GitHub 레포가 없습니다.")
    return RepoInfo(
        project_repo_id=repo.project_repo_id,
        owner=repo.owner,
        repo_name=repo.repo_name,
        default_branch=repo.default_branch,
    )

def _ensure_branch_cache(db: Session, project_repo_id: int, branch: str, sha: Optional[str]) -> None:
    pb = (
        db.query(ProjectBranch)
        .filter(ProjectBranch.project_repo_id == project_repo_id, ProjectBranch.branch_name == branch)
        .first()
    )
    if not pb:
        db.add(ProjectBranch(
            project_repo_id=project_repo_id, branch_name=branch, head_sha=sha, is_protected=False
        ))
    else:
        if sha and pb.head_sha != sha:
            pb.head_sha = sha
    db.commit()

# 1) 브랜치 생성 (from_branch 기준)
# app/services/project_git/git_branch_service.py
def create_branch_service(db: Session, me: User, project_id: int, from_branch: str | None, new_branch: str) -> Dict:
    project_repo_id, owner, repo, default_branch = _get_repo_context(db, project_id)
    token = _get_github_token(db, me.user_id)

    base_branch = from_branch or default_branch 

    base_sha = _get_branch_head(owner, repo, base_branch, token)
    if not base_sha:
        raise HTTPException(status_code=404, detail=f"기준 브랜치를 찾지 못했습니다: {base_branch}")

    existing = _get_branch_head(owner, repo, new_branch, token)
    if existing:
        raise HTTPException(status_code=409, detail=f"이미 존재하는 브랜치: {new_branch}")

    r = requests.post(
        f"{GITHUB_API}/repos/{owner}/{repo}/git/refs",
        headers=_gh_headers(token),
        json={"ref": f"refs/heads/{new_branch}", "sha": base_sha},
    )
    if r.status_code != 201:
        raise HTTPException(status_code=r.status_code, detail=f"브랜치 생성 실패: {r.text}")

    _ensure_branch_cache(db, project_repo_id, new_branch, base_sha)
    return {"branch_name": new_branch, "head_sha": base_sha, "is_protected": False}

# 2) 브랜치 스위치(존재 검증 + 캐시 갱신, UI 전환용)
def switch_branch_service(
    db: Session,
    me: User,
    project_id: int,
    branch: str,
) -> Dict:
    project_repo_id, owner, repo, _ = _get_repo_context(db, project_id)
    token = _get_github_token(db, me.user_id)

    head = _get_branch_head(owner, repo, branch, token)
    if not head:
        raise HTTPException(status_code=404, detail=f"브랜치가 존재하지 않습니다: {branch}")

    _ensure_branch_cache(db, project_repo_id, branch, head)

    return {"branch_name": branch, "head_sha": head, "is_protected": False}

def list_branches_service(
    db: Session,
    me: User,
    project_id: int,
) -> List[Dict]:
    project_repo_id, owner, repo, _ = _get_repo_context(db, project_id)
    token = _get_github_token(db, me.user_id)

    r = requests.get(
        f"{GITHUB_API}/repos/{owner}/{repo}/branches",
        headers=_gh_headers(token),
    )
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=f"브랜치 목록 조회 실패: {r.text}")

    branches = r.json()
    results = []
    for br in branches:
        name = br.get("name")
        sha = (br.get("commit") or {}).get("sha")
        protected = br.get("protected", False)

        # 캐시 갱신
        _ensure_branch_cache(db, project_repo_id, name, sha)
        results.append({
            "branch_name": name,
            "head_sha": sha,
            "is_protected": protected,
        })

    return results

def merge_branch_service(
    db: Session,
    current_user: User,
    project_id: int,
    base: str,
    head: str,
    message: str | None,
) -> dict:
    """
    GitHub API를 사용하여 브랜치를 병합합니다.
    """
    if base == head:
        raise HTTPException(status_code=400, detail="동일한 브랜치를 병합할 수 없습니다.")

    # 1. 레포 정보와 GitHub 토큰 가져오기
    _, owner, repo, _ = _get_repo_context(db, project_id)
    token = _get_github_token(db, current_user.user_id)

    # 2. GitHub API에 병합 요청
    url = f"{GITHUB_API}/repos/{owner}/{repo}/merges"
    payload = {
        "base": base,
        "head": head,
    }
    if message:
        payload["commit_message"] = message

    response = requests.post(url, headers=_gh_headers(token), json=payload)

    # 3. GitHub API 응답 처리
    if response.status_code == 201:  # 성공적으로 병합 & 커밋 생성
        data = response.json()
        return {
            "sha": data["sha"],
            "message": data["commit"]["message"],
            "author_name": data["commit"]["author"]["name"],
            "merged": True,
            "details": f"성공적으로 '{head}' 브랜치를 '{base}' 브랜치에 병합했습니다.",
        }
    
    elif response.status_code == 204:  # 이미 병합된 상태 (변경 사항 없음)
        return {
            "sha": "N/A",
            "message": "No new commits to merge.",
            "author_name": "System",
            "merged": True,
            "details": f"'{head}' 브랜치는 이미 '{base}' 브랜치에 최신 상태로 병합되어 있습니다.",
        }
        
    elif response.status_code == 409:  # 충돌(Conflict) 발생
        raise HTTPException(
            status_code=409,
            detail="자동 병합에 실패했습니다. 충돌(conflict)을 해결해야 합니다."
        )
        
    elif response.status_code == 404:  # 브랜치 찾을 수 없음
        raise HTTPException(
            status_code=404,
            detail=f"'{base}' 또는 '{head}' 브랜치를 찾을 수 없습니다."
        )
        
    else:  # 그 외 GitHub API 오류
        raise HTTPException(
            status_code=response.status_code,
            detail=f"GitHub API 오류: {response.text}"
        )