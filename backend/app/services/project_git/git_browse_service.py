# 트리/파일 조회 전용 서비스
from __future__ import annotations
import base64
from typing import List, Dict, Optional, Tuple

import requests
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.project_git.project_repo import ProjectRepo
from app.models.project_git.project_code_buffer import ProjectCodeBuffer
from app.models.user import User
from app.services.project_git.github_service import _get_github_token, _gh_headers, GITHUB_API


# ---- 내부 공용 헬퍼 ---------------------------------------------------------

def _get_repo_context(db: Session, project_id: int) -> Tuple[int, str, str, str]:
    """
    주어진 project_id에 연결된 GitHub 레포 정보를 읽어온다.
    return: (project_repo_id, owner, repo_name, default_branch)
    """
    repo = (
        db.query(ProjectRepo)
        .filter(ProjectRepo.project_id == project_id, ProjectRepo.provider == "github")
        .first()
    )
    if not repo:
        raise HTTPException(status_code=404, detail="프로젝트에 연결된 GitHub 레포가 없습니다.")
    return repo.project_repo_id, repo.owner, repo.repo_name, repo.default_branch


def _github_tree(owner: str, repo: str, branch: str, token: str, recursive: bool) -> List[Dict]:
    """
    GitHub git/trees API 호출 (브랜치 이름으로 SHA-resolve를 GitHub가 해줌)
    """
    url = f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/{branch}"
    params = {"recursive": "1"} if recursive else {}
    r = requests.get(url, headers=_gh_headers(token), params=params)
    if r.status_code != 200:
        try:
            j = r.json()
        except Exception:
            j = {}
        msg = j.get("message") or r.text
        raise HTTPException(status_code=r.status_code, detail=f"GitHub 트리 조회 실패: {msg}")
    data = r.json() or {}
    return data.get("tree", [])


def _github_file_content(owner: str, repo: str, branch: str, path: str, token: str) -> Tuple[str, Optional[str]]:
    """
    GitHub contents 또는 blobs API로 파일 내용을 가져온다.
    return: (content_str, blob_sha)
    """
    # 1) contents API 우선
    url = f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}"
    params = {"ref": branch}
    r = requests.get(url, headers=_gh_headers(token), params=params)

    # contents API가 200이면 base64 디코딩
    if r.status_code == 200:
        j = r.json()
        if isinstance(j, list):
            # 디렉토리인 경우
            raise HTTPException(status_code=400, detail="요청 경로는 파일이 아닙니다(디렉토리).")
        if j.get("type") != "file":
            raise HTTPException(status_code=400, detail=f"지원하지 않는 타입: {j.get('type')}")
        encoded = j.get("content", "")
        content = base64.b64decode(encoded.encode("utf-8")).decode("utf-8", errors="ignore")
        return content, j.get("sha")

    # 2) fallback: git/trees로 sha 찾고 blobs로 다운로드
    if r.status_code in (404, 409):
        # 경로가 특수문자 포함 등의 이유로 contents 실패 시 트리로 sha를 찾는다.
        tree = _github_tree(owner, repo, branch, token, recursive=True)
        sha = None
        for node in tree:
            if node.get("path") == path and node.get("type") == "blob":
                sha = node.get("sha")
                break
        if not sha:
            raise HTTPException(status_code=404, detail="GitHub에서 파일을 찾을 수 없습니다.")

        b = requests.get(f"{GITHUB_API}/repos/{owner}/{repo}/git/blobs/{sha}", headers=_gh_headers(token))
        if b.status_code != 200:
            raise HTTPException(status_code=b.status_code, detail="GitHub blob 조회 실패")
        bj = b.json()
        encoded = bj.get("content", "")
        content = base64.b64decode(encoded.encode("utf-8")).decode("utf-8", errors="ignore")
        return content, sha

    # 그 외 에러
    try:
        j = r.json()
    except Exception:
        j = {}
    msg = j.get("message") or r.text
    raise HTTPException(status_code=r.status_code, detail=f"GitHub 파일 조회 실패: {msg}")


# ---- 공개 서비스 함수 -------------------------------------------------------

def get_repo_tree(
    db: Session,
    current_user: User,
    project_id: int,
    branch: Optional[str],
    base_path: str,
    recursive: bool,
) -> Dict:
    """
    레포 트리를 조회하고, 현재 사용자 버퍼(ProjectCodeBuffer)를 오버레이한다.
    반환 형태는 app/schemas/github.TreeResponse와 호환되게 구성.
    """
    project_repo_id, owner, repo, default_branch = _get_repo_context(db, project_id)
    branch = branch or default_branch
    token = _get_github_token(db, current_user.user_id)
    
    # GitHub에서 전체 파일/폴더 목록을 가져온다
    tree = _github_tree(owner, repo, branch, token, recursive=recursive)

    # 1) GitHub 트리를 딕셔너리로 변환 (경로를 key로 사용)
    # 기존의 복잡한 상대 경로 계산 로직을 제거하고, GitHub가 주는 전체 경로를 그대로 사용한다.
    # 프론트엔드는 이 전체 경로 목록을 받아 직접 트리 구조를 만들기 때문에 이게 더 안정적이다.
    items: Dict[str, Dict] = {}
    for node in tree:
        path = node.get("path")
        if not path:
            continue
            
        # base_path가 지정된 경우, 해당 경로 하위의 항목만 필터링한다.
        # 루트 조회 시(base_path="") 이 조건은 무시된다.
        if base_path and not path.startswith(base_path.rstrip("/") + "/"):
            continue

        items[path] = {
            "path": path,
            "type": node.get("type"),
            "size": node.get("size"),
            "sha": node.get("sha"),
        }

    # 2) 사용자 버퍼 오버레이 (DB에 임시 저장된 변경사항을 덮어쓰기)
    buffers = (
        db.query(ProjectCodeBuffer)
        .filter(
            ProjectCodeBuffer.project_repo_id == project_repo_id,
            ProjectCodeBuffer.branch_name == branch,
            ProjectCodeBuffer.user_id == current_user.user_id,
        )
        .all()
    )
    for b in buffers:
        path = b.path
        
        # base_path 필터링 (버퍼 항목에도 동일하게 적용)
        if base_path and not path.startswith(base_path.rstrip("/") + "/"):
            continue

        if b.change_type == "D":
            # '삭제'로 표시된 항목은 최종 목록에서 제거한다.
            if path in items:
                del items[path]
        else:
            # '추가' 또는 '수정'된 항목은 최종 목록에 덮어쓴다.
            # 이 항목들은 아직 커밋 전이라 sha가 없으므로 None으로 설정한다.
            items[path] = {
                "path": path,
                "type": "blob",  # 버퍼에 있는 건 항상 파일(blob)로 취급
                "size": None,
                "sha": None,
            }

    return {
        "branch": branch,
        "recursive": recursive,
        "items": list(items.values()),
    }



def get_repo_file(
    db: Session,
    current_user: User,
    project_id: int,
    branch: Optional[str],
    path: str,
) -> Dict:
    """
    파일 내용을 가져온다.
    - 우선순위: 사용자의 버퍼(ProjectCodeBuffer) → GitHub
    반환 형태는 FileData와 호환되게 구성.
    """
    if not path or path.endswith("/"):
        raise HTTPException(status_code=400, detail="올바른 파일 경로를 입력하세요.")

    project_repo_id, owner, repo, default_branch = _get_repo_context(db, project_id)
    branch = branch or default_branch

    # 1) 사용자 버퍼 우선
    buf = (
        db.query(ProjectCodeBuffer)
        .filter(
            ProjectCodeBuffer.project_repo_id == project_repo_id,
            ProjectCodeBuffer.branch_name == branch,
            ProjectCodeBuffer.path == path,
            ProjectCodeBuffer.user_id == current_user.user_id,
        )
        .first()
    )
    if buf and buf.change_type != "D":
        return {
            "branch": branch,
            "path": path,
            "content": buf.content or "",
            "base_sha": buf.base_sha,
            "is_staged": bool(buf.is_staged),
            "change_type": buf.change_type,
            "source": "buffer",
        }

    # 2) GitHub에서 파일 가져오기
    token = _get_github_token(db, current_user.user_id)
    content, sha = _github_file_content(owner, repo, branch, path, token)
    return {
        "branch": branch,
        "path": path,
        "content": content,
        "base_sha": sha,
        "is_staged": False,
        "change_type": None,
        "source": "github",
    }

def get_connection_status(db: Session, project_id: int) -> Dict:
    """
    프로젝트의 GitHub 저장소 연결 상태를 확인한다.
    """
    try:
        # _get_repo_context는 레포가 없으면 404 예외를 발생시킨다.
        _, owner, repo, _ = _get_repo_context(db, project_id)
        
        # 레포 정보가 있으면 연결된 것으로 간주
        return {
            "is_connected": True,
            "owner": owner,
            "repo_name": repo,
            "repo_url": f"https://github.com/{owner}/{repo}"
        }
    except HTTPException as e:
        if e.status_code == 404:
            # _get_repo_context에서 레포를 찾지 못한 경우
            return {"is_connected": False}
        # 다른 예외는 그대로 전달
        raise e

def get_commit_history(
    db: Session,
    current_user: User,
    project_id: int,
    branch: str,
    limit: int = 30,
) -> List[Dict]:
    """
    특정 브랜치의 커밋 내역을 GitHub에서 가져온다.
    """
    _, owner, repo, _ = _get_repo_context(db, project_id)
    token = _get_github_token(db, current_user.user_id)

    url = f"{GITHUB_API}/repos/{owner}/{repo}/commits"
    params = {"sha": branch, "per_page": limit}
    
    r = requests.get(url, headers=_gh_headers(token), params=params)
    
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail="GitHub 커밋 내역 조회에 실패했습니다.")
    
    commits_data = r.json()
    history = []
    for c in commits_data:
        history.append({
            "sha": c.get("sha"),
            "message": (c.get("commit") or {}).get("message"),
            "author": (c.get("commit") or {}).get("author", {}).get("name"),
            "date": (c.get("commit") or {}).get("author", {}).get("date"),
        })
    return history