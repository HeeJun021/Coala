from __future__ import annotations
from typing import List, Optional, Tuple, Dict
import requests
import base64
import binascii
import os

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.project_git.project_repo import ProjectRepo
from app.models.project_git.project_branch import ProjectBranch
from app.models.project_git.project_code_buffer import ProjectCodeBuffer
from app.services.project_git.github_service import _get_github_token, _gh_headers, GITHUB_API

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5MB

STARTER_CODES = {
    ".html": """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Document</title>
</head>
<body>
  <h1>Hello, World!</h1>
</body>
</html>
""",
    ".css": """/* Starter CSS */
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
}
h1 {
  color: #333;
}
""",
    ".js": """// Starter JavaScript
console.log("Hello, World!");
""",
    ".jsx": """import React from "react";

export default function App() {
  return (
    <div>
      <h1>Hello, World!</h1>
    </div>
  );
}
""",
    ".py": """# Starter Python script

def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()
""",
}

# --- 컨텍스트/캐시 헬퍼 -------------------------------------------------

def _decode_content_for_storage(raw: str, encoding: str) -> str:
    """
    저장 전 content를 디코드하고 사이즈 제한 검사.
    - encoding='base64'면 디코드 후 utf-8로 decode
    - encoding='utf-8'이면 그대로 사용
    - 최종 바이트 길이가 MAX_FILE_SIZE_BYTES 초과면 413
    """
    try:
        if encoding == "base64":
            binary = base64.b64decode(raw, validate=True)
            if len(binary) > MAX_FILE_SIZE_BYTES:
                raise HTTPException(status_code=413, detail="파일이 너무 큽니다(> 5MB).")
            return binary.decode("utf-8", errors="strict")
        else:
            # utf-8 텍스트 길이 체크
            b = raw.encode("utf-8")
            if len(b) > MAX_FILE_SIZE_BYTES:
                raise HTTPException(status_code=413, detail="파일이 너무 큽니다(> 5MB).")
            return raw
    except (binascii.Error, UnicodeDecodeError):
        raise HTTPException(status_code=400, detail="콘텐츠 디코딩 실패(encoding 확인).")

def _get_repo_context(db: Session, project_id: int) -> Tuple[int, str, str, str]:
    repo = (
        db.query(ProjectRepo)
        .filter(ProjectRepo.project_id == project_id, ProjectRepo.provider == "github")
        .first()
    )
    if not repo:
        raise HTTPException(status_code=404, detail="프로젝트에 연결된 GitHub 레포가 없습니다.")
    return repo.project_repo_id, repo.owner, repo.repo_name, repo.default_branch

def _ensure_branch_head(db: Session, project_repo_id: int, owner: str, repo: str, branch: str, token: str) -> str:
    pb = (
        db.query(ProjectBranch)
        .filter(ProjectBranch.project_repo_id == project_repo_id, ProjectBranch.branch_name == branch)
        .first()
    )
    if pb and pb.head_sha:
        return pb.head_sha

    r = requests.get(f"{GITHUB_API}/repos/{owner}/{repo}/git/refs/heads/{branch}", headers=_gh_headers(token))
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=f"브랜치 참조 조회 실패: {r.text}")
    head_sha = (r.json().get("object") or {}).get("sha")
    if not head_sha:
        raise HTTPException(status_code=500, detail="브랜치 HEAD SHA를 찾지 못했습니다.")

    if not pb:
        pb = ProjectBranch(project_repo_id=project_repo_id, branch_name=branch, head_sha=head_sha)
        db.add(pb)
    else:
        pb.head_sha = head_sha
    db.commit()
    return head_sha

def _get_file_sha(owner: str, repo: str, branch: str, path: str, token: str) -> Optional[str]:
    r = requests.get(
        f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}",
        headers=_gh_headers(token),
        params={"ref": branch},
    )
    if r.status_code == 200 and isinstance(r.json(), dict) and r.json().get("type") == "file":
        return r.json().get("sha")
    return None

# --- 1) 버퍼 저장/업서트 -------------------------------------------------

def save_file_to_buffer(
    db: Session,
    current_user: User,
    project_id: int,
    branch: Optional[str],
    path: str,
    content: str,
    change_type: Optional[str] = None,  # "A" | "M" | "D"
    encoding: str = "utf-8",            # ← 추가
    expected_base_sha: Optional[str] = None,  # ← 추가
) -> Dict:
    project_repo_id, owner, repo, default_branch = _get_repo_context(db, project_id)
    branch = branch or default_branch
    token = _get_github_token(db, current_user.user_id)

    # 현재 원격 파일 sha 조회
    current_sha = _get_file_sha(owner, repo, branch, path, token)

    # 낙관적 잠금: expected_base_sha가 주어졌고, 현재 sha와 다르면 409
    if expected_base_sha is not None and expected_base_sha != current_sha:
        raise HTTPException(status_code=409, detail="원본이 변경되어 저장할 수 없습니다(SHA mismatch).")

    # change_type 자동 추론 (없으면)
    if change_type is None:
        change_type = "M" if current_sha else "A"

    # content 디코딩 + 사이즈 제한
    decoded = _decode_content_for_storage(content, encoding)

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
    if not buf:
        buf = ProjectCodeBuffer(
            project_repo_id=project_repo_id,
            branch_name=branch,
            path=path,
            user_id=current_user.user_id,
        )
        db.add(buf)

    buf.content = decoded
    buf.change_type = change_type
    buf.is_staged = False
    buf.base_sha = current_sha

    db.commit()

    return {
        "branch": branch,
        "path": path,
        "content": decoded,
        "base_sha": buf.base_sha,
        "is_staged": buf.is_staged,
        "change_type": buf.change_type,
        "source": "buffer",
        "encoding": "utf-8",  # 버퍼에는 UTF-8 텍스트로 저장
    }


# --- 2) 스테이징/언스테이징 -------------------------------------------------

def stage_paths(
    db: Session,
    current_user: User,
    project_id: int,
    branch: Optional[str],
    paths: List[str],
    staged: bool,
) -> Dict:
    project_repo_id, _, _, default_branch = _get_repo_context(db, project_id)
    branch = branch or default_branch

    rows = (
        db.query(ProjectCodeBuffer)
        .filter(
            ProjectCodeBuffer.project_repo_id == project_repo_id,
            ProjectCodeBuffer.branch_name == branch,
            ProjectCodeBuffer.user_id == current_user.user_id,
            ProjectCodeBuffer.path.in_(paths),
        )
        .all()
    )
    touched = []
    for b in rows:
        b.is_staged = staged
        touched.append(b.path)
    db.commit()

    return {
        "branch": branch,
        "staged": sorted([p for p in touched if staged]),
        "unstaged": sorted([p for p in touched if not staged]),
    }

# --- 3) 커밋(=푸시) -------------------------------------------------
def commit_changes(
    db: Session,
    current_user: User,
    project_id: int,
    branch: Optional[str],
    message: str,
    use_staged_only: bool = True,
    only_paths: Optional[List[str]] = None,
    expected_head_sha: Optional[str] = None,          # ← 추가
) -> Dict:
    project_repo_id, owner, repo, default_branch = _get_repo_context(db, project_id)
    branch = branch or default_branch
    token = _get_github_token(db, current_user.user_id)

    q = (
        db.query(ProjectCodeBuffer)
        .filter(
            ProjectCodeBuffer.project_repo_id == project_repo_id,
            ProjectCodeBuffer.branch_name == branch,
            ProjectCodeBuffer.user_id == current_user.user_id,
        )
    )
    if use_staged_only:
        q = q.filter(ProjectCodeBuffer.is_staged == True)
    if only_paths:
        q = q.filter(ProjectCodeBuffer.path.in_(only_paths))
    buffers = q.all()
    if not buffers:
        raise HTTPException(status_code=400, detail="커밋할 변경이 없습니다.")

    head_sha = _ensure_branch_head(db, project_repo_id, owner, repo, branch, token)

    # 낙관적 잠금: expected_head_sha가 주어졌고, 현재 head와 다르면 409
    if expected_head_sha is not None and expected_head_sha != head_sha:
        raise HTTPException(status_code=409, detail="브랜치 HEAD가 변경되었습니다(SHA mismatch).")

    # base tree
    r = requests.get(f"{GITHUB_API}/repos/{owner}/{repo}/git/commits/{head_sha}", headers=_gh_headers(token))
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=f"베이스 커밋 조회 실패: {r.text}")
    base_tree_sha = (r.json().get("tree") or {}).get("sha")
    if not base_tree_sha:
        raise HTTPException(status_code=500, detail="베이스 트리 SHA를 찾지 못했습니다.")

    # blobs
    tree_entries = []
    for b in buffers:
        if b.change_type == "D":
            tree_entries.append({"path": b.path, "mode": "100644", "type": "blob", "sha": None})
            continue

        create_blob = requests.post(
            f"{GITHUB_API}/repos/{owner}/{repo}/git/blobs",
            headers=_gh_headers(token),
            json={"content": b.content or "", "encoding": "utf-8"},
        )
        if create_blob.status_code != 201:
            raise HTTPException(status_code=create_blob.status_code, detail=f"blob 생성 실패: {create_blob.text}")
        blob_sha = create_blob.json().get("sha")
        tree_entries.append({"path": b.path, "mode": "100644", "type": "blob", "sha": blob_sha})

    # tree
    create_tree = requests.post(
        f"{GITHUB_API}/repos/{owner}/{repo}/git/trees",
        headers=_gh_headers(token),
        json={"base_tree": base_tree_sha, "tree": tree_entries},
    )
    if create_tree.status_code != 201:
        raise HTTPException(status_code=create_tree.status_code, detail=f"트리 생성 실패: {create_tree.text}")
    new_tree_sha = create_tree.json().get("sha")

    # commit
    create_commit = requests.post(
        f"{GITHUB_API}/repos/{owner}/{repo}/git/commits",
        headers=_gh_headers(token),
        json={"message": message, "tree": new_tree_sha, "parents": [head_sha]},
    )
    if create_commit.status_code != 201:
        raise HTTPException(status_code=create_commit.status_code, detail=f"커밋 생성 실패: {create_commit.text}")
    new_commit_sha = create_commit.json().get("sha")

    # update ref (= push)
    update_ref = requests.patch(
        f"{GITHUB_API}/repos/{owner}/{repo}/git/refs/heads/{branch}",
        headers=_gh_headers(token),
        json={"sha": new_commit_sha, "force": False},
    )
    if update_ref.status_code != 200:
        raise HTTPException(status_code=update_ref.status_code, detail=f"브랜치 업데이트 실패: {update_ref.text}")

    # 정리: 버퍼 삭제 & HEAD 캐시 갱신
    for b in buffers:
        db.delete(b)
    pb = (
        db.query(ProjectBranch)
        .filter(ProjectBranch.project_repo_id == project_repo_id, ProjectBranch.branch_name == branch)
        .first()
    )
    if not pb:
        pb = ProjectBranch(project_repo_id=project_repo_id, branch_name=branch, head_sha=new_commit_sha)
        db.add(pb)
    else:
        pb.head_sha = new_commit_sha
    db.commit()

    return {"branch": branch, "commit_sha": new_commit_sha}

def create_new_file_service(
    db: Session,
    current_user: User,
    project_id: int,
    branch: Optional[str],
    path: str,
    content: str,
) -> Dict:
    """
    새 파일을 '버퍼'에 생성(change_type='A').
    실제 GitHub 생성은 stage+commit 때 일어남.
    content가 비어 있으면 확장자별 스타터코드를 자동 삽입.
    """
    if not path or path.endswith("/"):
        raise HTTPException(status_code=400, detail="올바른 파일 경로를 입력하세요.")

    project_repo_id, owner, repo, default_branch = _get_repo_context(db, project_id)
    branch = branch or default_branch
    token = _get_github_token(db, current_user.user_id)

    # GitHub에 이미 같은 경로 파일이 존재하면 생성 불가
    if _get_file_sha(owner, repo, branch, path, token):
        raise HTTPException(status_code=409, detail="이미 존재하는 파일 경로입니다.")

    # 동일 경로 버퍼가 있으면 업서트 대신 생성 의미를 유지하도록 방어
    existing = (
        db.query(ProjectCodeBuffer)
        .filter(
            ProjectCodeBuffer.project_repo_id == project_repo_id,
            ProjectCodeBuffer.branch_name == branch,
            ProjectCodeBuffer.path == path,
            ProjectCodeBuffer.user_id == current_user.user_id,
        )
        .first()
    )
    if existing and existing.change_type != "D":
        raise HTTPException(status_code=409, detail="이미 버퍼에 동일 경로가 존재합니다.")

    # content가 비어 있으면 확장자 기반 스타터코드 삽입
    ext = os.path.splitext(path)[1].lower()
    starter = STARTER_CODES.get(ext, "")
    final_content = content or starter

    # content 디코딩 + 사이즈 제한
    decoded = _decode_content_for_storage(final_content, "utf-8")

    buf = existing or ProjectCodeBuffer(
        project_repo_id=project_repo_id,
        branch_name=branch,
        path=path,
        user_id=current_user.user_id,
    )
    buf.content = decoded
    buf.change_type = "A"
    buf.is_staged = False
    buf.base_sha = None  # 신규 파일이므로 원본 없음

    db.add(buf)
    db.commit()

    return {
        "branch": branch,
        "path": path,
        "content": decoded,
        "base_sha": buf.base_sha,
        "is_staged": buf.is_staged,
        "change_type": buf.change_type,
        "source": "buffer",
        "encoding": "utf-8",  # 버퍼에는 UTF-8 텍스트로 저장
    }

# ---- 상태 조회 ----
def get_change_status(
    db: Session,
    current_user: User,
    project_id: int,
    branch: Optional[str],
) -> Dict:
    project_repo_id, owner, repo, default_branch = _get_repo_context(db, project_id)
    branch = branch or default_branch

    rows: List[ProjectCodeBuffer] = (
        db.query(ProjectCodeBuffer)
        .filter(
            ProjectCodeBuffer.project_repo_id == project_repo_id,
            ProjectCodeBuffer.branch_name == branch,
            ProjectCodeBuffer.user_id == current_user.user_id,
        )
        .all()
    )

    staged = []
    unstaged = []
    for r in rows:
        label = r.path
        if r.is_staged:
            staged.append(label)
        else:
            unstaged.append(label)

    return {
        "branch": branch,
        "staged": sorted(list(set(staged))),
        "unstaged": sorted(list(set(unstaged))),
        "has_uncommitted": bool(staged or unstaged),
    }

# ---- 파일 수정 (버퍼) ----
def update_file_service(
    db: Session,
    current_user: User,
    project_id: int,
    branch: Optional[str],
    path: str,
    content: str,
) -> Dict:
    if not path or path.endswith("/"):
        raise HTTPException(status_code=400, detail="올바른 파일 경로를 입력하세요.")

    project_repo_id, owner, repo, default_branch = _get_repo_context(db, project_id)
    branch = branch or default_branch
    token = _get_github_token(db, current_user.user_id)

    # 1) 기존 버퍼 조회
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

    # content 디코딩 + 사이즈 제한 (utf-8 전제)
    decoded = _decode_content_for_storage(content, "utf-8")

    if buf:
        if buf.change_type == "D":
            raise HTTPException(status_code=409, detail="삭제 예정인 파일입니다. 삭제를 취소하거나 경로를 변경하세요.")
        # 신규 추가중(A)이면 그대로 업데이트 가능, 이외엔 수정(M)로 강제
        buf.content = decoded
        if buf.change_type != "A":
            buf.change_type = "M"
        db.commit()
        return {
            "branch": branch,
            "path": path,
            "content": buf.content or "",
            "base_sha": buf.base_sha,
            "is_staged": bool(buf.is_staged),
            "change_type": buf.change_type,
            "source": "buffer",
            "encoding": "utf-8",
        }

    # 2) 버퍼가 없으면 GitHub 존재 확인 (없으면 404)
    sha = _get_file_sha(owner, repo, branch, path, token)
    if not sha:
        raise HTTPException(status_code=404, detail="수정 대상 파일을 찾을 수 없습니다.")

    # 3) 새 버퍼 생성: 수정(M)
    newb = ProjectCodeBuffer(
        project_repo_id=project_repo_id,
        branch_name=branch,
        path=path,
        user_id=current_user.user_id,
        content=decoded,
        base_sha=sha,
        change_type="M",
        is_staged=False,
    )
    db.add(newb)
    db.commit()

    return {
        "branch": branch,
        "path": path,
        "content": decoded,
        "base_sha": sha,
        "is_staged": False,
        "change_type": "M",
        "source": "buffer",
        "encoding": "utf-8",
    }


# ---- 파일 삭제 (버퍼) ----
def delete_file_service(
    db: Session,
    current_user: User,
    project_id: int,
    branch: Optional[str],
    path: str,
) -> Dict:
    if not path or path.endswith("/"):
        raise HTTPException(status_code=400, detail="올바른 파일 경로를 입력하세요.")

    project_repo_id, owner, repo, default_branch = _get_repo_context(db, project_id)
    branch = branch or default_branch
    token = _get_github_token(db, current_user.user_id)

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

    if buf:
        # 신규 추가(A)였으면 삭제는 버퍼에서만 제거하면 됨(커밋 필요 X)
        if buf.change_type == "A":
            db.delete(buf)
            db.commit()
            return {"message": "신규 추가 중이던 파일을 취소했습니다(버퍼 삭제).", "path": path, "branch": branch}

        # 기존 파일 수정/미상태 → 삭제로 전환
        buf.change_type = "D"
        db.commit()
        return {"message": "삭제로 표시되었습니다. 커밋 시 GitHub에서 삭제됩니다.", "path": path, "branch": branch}

    # 버퍼가 없으면 GitHub에 있는지 확인
    sha = _get_file_sha(owner, repo, branch, path, token)
    if not sha:
        raise HTTPException(status_code=404, detail="삭제 대상 파일을 찾을 수 없습니다.")

    # 삭제 버퍼 생성
    newb = ProjectCodeBuffer(
        project_repo_id=project_repo_id,
        branch_name=branch,
        path=path,
        user_id=current_user.user_id,
        content="",
        base_sha=sha,
        change_type="D",
        is_staged=False,
    )
    db.add(newb)
    db.commit()

    return {"message": "삭제로 표시되었습니다. 커밋 시 GitHub에서 삭제됩니다.", "path": path, "branch": branch}