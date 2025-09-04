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
    tree = _github_tree(owner, repo, branch, token, recursive=recursive)

    # 1) GitHub 트리 → UI용 items로 정규화
    items: Dict[str, Dict] = {}
    for node in tree:
        p = node.get("path", "")
        t = node.get("type")  # "blob" | "tree"
        if base_path and not p.startswith(base_path.rstrip("/") + "/") and p != base_path:
            # base_path 하위만
            continue
        # base_path 제거(상대경로로)
        rel = p[len(base_path) + 1:] if base_path and p.startswith(base_path + "/") else ("" if p == base_path else p)
        if rel == "":
            continue
        items[rel] = {
            "path": rel,
            "type": t,
            "size": node.get("size"),
            "sha": node.get("sha"),
        }

    # 2) 사용자 버퍼 오버레이 (추가/수정/삭제 반영)
    buffers = (
        db.query(ProjectCodeBuffer)
        .filter(
            ProjectCodeBuffer.project_repo_id == project_repo_id,
            ProjectCodeBuffer.branch_name == branch,
        )
        .filter(ProjectCodeBuffer.user_id == current_user.user_id)
        .all()
    )
    for b in buffers:
        # base_path 필터링
        if base_path and not (b.path == base_path or b.path.startswith(base_path.rstrip("/") + "/")):
            continue
        # 상대 경로
        rel = b.path[len(base_path) + 1:] if base_path and b.path.startswith(base_path + "/") else ("" if b.path == base_path else b.path)
        if rel == "":
            continue

        if b.is_deleted or b.change_type == "D":
            # 삭제로 표시되면 목록에서 제거
            if rel in items:
                del items[rel]
            continue

        # 추가/수정은 blob로 표시 (size/sha는 None으로 둠)
        items[rel] = {
            "path": rel,
            "type": "blob",
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
    if buf and not buf.is_deleted:
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
