from __future__ import annotations
import requests
from typing import Tuple, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.project_models import Project
from app.models.project_git.project_repo import ProjectRepo
from app.models.project_git.project_branch import ProjectBranch
from app.models.social_login import SocialLogin
from app.models.user import User
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
        owner_user_id=user_id,
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

def get_project_owner_user_id(db: Session, project_id: int) -> int:
    """
    1순위: ProjectRepo.owner_user_id (레포 소유자로 저장된 사용자)
    2순위: Project.creator_user_id (프로젝트 생성자)
    3순위: ProjectMembers 중 leader(또는 owner) 역할 사용자
    """
    # 1) 레포 소유자
    repo = (
        db.query(ProjectRepo)
        .filter(ProjectRepo.project_id == project_id, ProjectRepo.provider == "github")
        .first()
    )
    if repo and getattr(repo, "owner_user_id", None):
        return repo.owner_user_id

    # 2) 프로젝트 생성자
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if project and getattr(project, "creator_user_id", None):
        return project.creator_user_id

    # 3) 프로젝트 리더(역할 이름은 실제 스키마에 맞게 조정)
    # 예: ProjectMembers(role = 'leader') 또는 roles JSON에 leader 플래그
    from app.models.project_models import ProjectMembers  # 순환참조 방지용 내부 import

    leader = (
        db.query(ProjectMembers)
        .filter(
            ProjectMembers.project_id == project_id,
            # 아래 조건은 실제 컬럼에 맞게 수정: 예) ProjectMembers.role == "leader"
            # 또는 ProjectMembers.is_leader == True 등
            ProjectMembers.role == "leader"
        )
        .first()
    )
    if leader:
        return leader.user_id

    raise HTTPException(status_code=500, detail="프로젝트 소유자를 결정할 수 없습니다.")


def _resolve_invitee_login(db: Session, invitee_user_id: int) -> str:
    """
    초대받는 사용자의 GitHub login을 사용자 정보로부터 안전하게 해석한다.
    우선순위: User.github_username -> User.github_access_token -> SocialLogin(access_token)
    마지막으로도 없으면 400 에러.
    """
    # 1) 유저 로드
    user: Optional[User] = db.query(User).filter(User.user_id == invitee_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Invitee user not found")

    # 2) DB에 저장된 github_username이 있으면 그대로 사용
    if getattr(user, "github_username", None):
        return user.github_username

    # 3) 토큰으로 /user 조회해서 login 획득 시도
    token = getattr(user, "github_access_token", None)
    if not token:
        # 기존 유틸이 있다면 재사용
        try:
            token = _get_github_token(db, invitee_user_id)  # 기존 함수
        except Exception:
            token = None

    if token:
        login = _get_login_by_token(token)  # 기존 함수: /user 호출해서 login 반환
        if login:
            return login

    # 4) 여기까지 못 구하면 초대 불가
    raise HTTPException(status_code=400, detail="Invitee has no connected GitHub account (login not resolvable)")

def _get_repo_owner_token(
    db: Session,
    project_id: int,
    actor_user_id: Optional[int] = None,  # 로깅용, fallback로 쓰지 않음
) -> Tuple[str, str, str]:
    repo = (
        db.query(ProjectRepo)
        .filter(ProjectRepo.project_id == project_id)
        .first()
    )
    if not repo:
        raise HTTPException(status_code=404, detail="Repository mapping not found for this project")

    owner_login = repo.owner
    repo_name   = repo.repo_name
    if not owner_login or not repo_name:
        raise HTTPException(status_code=500, detail="Repository owner/repo_name not stored")

    owner_user_id = repo.owner_user_id
    if not owner_user_id:
        # (임시) 백필이 안 된 과거 데이터면 프로젝트 생성자를 사용
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if project and getattr(project, "creator_user_id", None):
            owner_user_id = project.creator_user_id
        else:
            raise HTTPException(status_code=500, detail="owner_user_id is not set for this repository")

    user = db.query(User).filter(User.user_id == owner_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Owner user not found")

    owner_token = getattr(user, "github_access_token", None)
    if not owner_token:
        sl = (
            db.query(SocialLogin)
            .filter(SocialLogin.user_id == owner_user_id, SocialLogin.provider == "github")
            .order_by(SocialLogin.id.desc())
            .first()
        )
        owner_token = getattr(sl, "access_token", None) if sl else None

    if not owner_token:
        raise HTTPException(status_code=403, detail="Owner has no GitHub token connected")

    return owner_login, repo_name, owner_token

def invite_collaborator(
    db: Session,
    project_id: int,
    invitee_user_id: int,
    permission: str = "push",
    actor_user_id: Optional[int] = None,
) -> dict:
    """
    GitHub 레포의 collaborator 초대.
    - 201 Created: 초대 성공
    - 202 Accepted: 초대 보류 (organization repo 등)
    - 204 No Content: 이미 collaborator
    - 409/422: 초대 이미 보류 중이거나 잘못된 요청
    """
    # 0) 레포 소유자 토큰/로그인/레포명 확보
    owner_login, repo_name, owner_token = _get_repo_owner_token(db, project_id, actor_user_id)

    # 1) 초대 대상자 GitHub 로그인명 확인
    invitee_login = _resolve_invitee_login(db, invitee_user_id)

    # 2) API 요청 URL/페이로드 준비
    url = f"{GITHUB_API}/repos/{owner_login}/{repo_name}/collaborators/{invitee_login}"
    payload = {"permission": permission}

    # 3) GitHub API 호출
    resp = requests.put(url, headers=_gh_headers(owner_token), json=payload)

    # 4) 정상 응답 처리
    if resp.status_code in (201, 202, 204):
        status_msg = (
            "invited" if resp.status_code == 201
            else "invitation_pending" if resp.status_code == 202
            else "already_collaborator"
        )
        return {
            "status": resp.status_code,
            "message": status_msg,
            "invitee_login": invitee_login,
            "owner_login": owner_login,
            "repo_name": repo_name,
        }

    # 5) 에러 응답 처리
    try:
        data = resp.json()
    except Exception:
        data = {}
    gh_msg = data.get("message") or resp.text

    # 초대 중복 / 잘못된 요청
    if resp.status_code in (409, 422):
        return {
            "status": resp.status_code,
            "message": "invitation_already_pending_or_invalid",
            "detail": gh_msg,
            "invitee_login": invitee_login,
            "owner_login": owner_login,
            "repo_name": repo_name,
        }

    # 나머지는 FastAPI HTTPException으로 위임
    raise HTTPException(
        status_code=resp.status_code,
        detail=f"GitHub collaborator 초대 실패: {gh_msg}",
    )



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