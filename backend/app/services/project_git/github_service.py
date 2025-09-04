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

def _get_login_by_token(token: str) -> str:
    """액세스 토큰으로 GitHub 로그인명(login) 조회"""
    r = requests.get(f"{GITHUB_API}/user", headers=_gh_headers(token))
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="GitHub 토큰으로 사용자 정보를 조회할 수 없습니다.")
    return r.json().get("login")

def _get_repo_owner_token(db: Session, project_id: int, actor_user_id: int | None = None) -> Tuple[str, str, str]:
    """
    프로젝트에 연결된 레포(owner/repo_name)의 소유자 토큰을 찾는다.
    1) ProjectRepo.owner 와 같은 login을 가진 사용자의 SocialLogin 토큰
    2) 없으면 actor(요청자)의 GitHub 토큰을 fallback
    반환: (owner_login, repo_name, owner_token)
    """
    repo = (
        db.query(ProjectRepo)
        .filter(ProjectRepo.project_id == project_id, ProjectRepo.provider == "github")
        .first()
    )
    if not repo:
        raise HTTPException(status_code=404, detail="GitHub 레포지토리 매핑이 없습니다.")

    # 1) owner 로그인과 일치하는 SocialLogin 찾기
    owner_sl = (
        db.query(SocialLogin)
        .filter(SocialLogin.provider == "github", SocialLogin.login == repo.owner)  # login 컬럼을 사용한다고 가정
        .first()
    )
    if owner_sl and owner_sl.access_token:
        return (repo.owner, repo.repo_name, owner_sl.access_token)

    # 2) fallback: actor의 토큰 사용
    if actor_user_id is not None:
        token = _get_github_token(db, actor_user_id)
        return (repo.owner, repo.repo_name, token)

    raise HTTPException(status_code=403, detail="레포 소유자 또는 요청자의 GitHub 토큰을 찾을 수 없습니다.")

def invite_collaborator(db: Session, project_id: int, invitee_user_id: int, permission: str = "push", actor_user_id: int | None = None) -> None:
    """
    프로젝트에 연결된 GitHub 레포에 초대 대상(invitee_user_id)을 collaborator로 초대한다.
    permission: pull / triage / push / maintain / admin
    """
    owner_login, repo_name, owner_token = _get_repo_owner_token(db, project_id, actor_user_id)

    # 초대 대상자의 GitHub 로그인명
    invitee_token = _get_github_token(db, invitee_user_id)
    invitee_login = _get_login_by_token(invitee_token)

    url = f"{GITHUB_API}/repos/{owner_login}/{repo_name}/collaborators/{invitee_login}"
    payload = {"permission": permission}
    resp = requests.put(url, headers=_gh_headers(owner_token), json=payload)

    # 201 Created, 204 No Content, 202 Accepted 다 정상 케이스
    if resp.status_code in (201, 204, 202):
        return

    try:
        j = resp.json()
    except Exception:
        j = {}
    msg = j.get("message") or resp.text
    raise HTTPException(status_code=resp.status_code, detail=f"GitHub collaborator 초대 실패: {msg}")

def remove_collaborator(db: Session, project_id: int, target_user_id: int, actor_user_id: int | None = None) -> None:
    """
    프로젝트 레포에서 collaborator 제거 (멤버 탈퇴/강퇴 시 사용)
    """
    owner_login, repo_name, owner_token = _get_repo_owner_token(db, project_id, actor_user_id)

    target_token = _get_github_token(db, target_user_id)
    target_login = _get_login_by_token(target_token)

    url = f"{GITHUB_API}/repos/{owner_login}/{repo_name}/collaborators/{target_login}"
    resp = requests.delete(url, headers=_gh_headers(owner_token))
    if resp.status_code in (204, 404):  # 404면 이미 권한 없음
        return
    try:
        j = resp.json()
    except Exception:
        j = {}
    msg = j.get("message") or resp.text
    raise HTTPException(status_code=resp.status_code, detail=f"GitHub collaborator 제거 실패: {msg}")