from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from github import Github
from app.database import get_db
from app.models.user import User
from app.models.social_login import SocialLogin
from app.models.code import CodeFolder
from app.dependencies.auth import get_current_user
from app.services.code import get_codes_in_folder, get_child_folders, get_code_by_id
from pydantic import BaseModel
import requests
from urllib.parse import unquote
from typing import List
import uuid
from threading import Lock
import base64

router = APIRouter(prefix="/freecode", tags=["GitHub"])

UPLOAD_SESSIONS = {}
SESSION_LOCK = Lock()

class CreateRepoRequest(BaseModel):
    name: str
    description: str = ""
    private: bool = False

class UploadRequest(BaseModel):
    repo_name: str
    paths: list[str]
    destination_path: str = ""

class CancelUploadRequest(BaseModel):
    repo_name: str
    session_id: str

class FolderCreateRequest(BaseModel):
    repo_name: str
    folder_path: str

class FileDeleteRequest(BaseModel):
    repo_name: str
    path: str

@router.get("/github/repos")
def get_github_repos(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    social_login = db.query(SocialLogin).filter(
        SocialLogin.user_id == current_user.user_id,
        SocialLogin.provider == "github"
    ).first()
    
    if not social_login:
        print(f"No social login found for user_id: {current_user.user_id}")
        raise HTTPException(status_code=401, detail="GitHub 계정이 연동되지 않았습니다.")
    
    if not social_login.access_token:
        print(f"No access_token found for social_login: {social_login.social_login_id}")
        raise HTTPException(status_code=401, detail="GitHub 액세스 토큰이 없습니다.")
    
    headers = {"Authorization": f"Bearer {social_login.access_token}"}
    response = requests.get("https://api.github.com/user/repos", headers=headers)
    if response.status_code != 200:
        print(f"GitHub API error: {response.status_code}, {response.text}")
        if response.status_code == 401:
            raise HTTPException(status_code=401, detail="GitHub 액세스 토큰이 유효하지 않습니다. 다시 연동해주세요.")
        elif response.status_code == 404:
            raise HTTPException(status_code=404, detail="GitHub 사용자 또는 리소스를 찾을 수 없습니다. 계정 연동을 확인해주세요.")
        response.raise_for_status()
    
    repos = response.json()
    return [
        {
            "id": repo["id"],
            "full_name": repo["full_name"],
            "description": repo["description"],
            "html_url": repo["html_url"]
        }
        for repo in repos
    ]

@router.post("/github/repos/create")
def create_github_repo(
    request: CreateRepoRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    social_login = db.query(SocialLogin).filter(
        SocialLogin.user_id == current_user.user_id,
        SocialLogin.provider == "github"
    ).first()
    
    if not social_login:
        print(f"No social login found for user_id: {current_user.user_id}")
        raise HTTPException(status_code=401, detail="GitHub 계정이 연동되지 않았습니다.")
    
    if not social_login.access_token:
        print(f"No access_token found for social_login: {social_login.social_login_id}")
        raise HTTPException(status_code=401, detail="GitHub 액세스 토큰이 없습니다.")
    
    headers = {"Authorization": f"Bearer {social_login.access_token}"}
    user_check = requests.get("https://api.github.com/user", headers=headers)
    if user_check.status_code != 200:
        print(f"GitHub user check failed: {user_check.status_code}, {user_check.text}")
        if user_check.status_code == 401:
            raise HTTPException(status_code=401, detail="GitHub 액세스 토큰이 유효하지 않습니다. 다시 연동해주세요.")
        raise HTTPException(status_code=user_check.status_code, detail="GitHub 사용자 인증에 실패했습니다.")

    create_headers = {
        "Authorization": f"Bearer {social_login.access_token}",
        "Accept": "application/vnd.github.v3+json"
    }
    print(f"🔍 GitHub 저장소 생성 요청: token={social_login.access_token}, payload={request.dict()}")
    payload = {
        "name": request.name,
        "description": request.description,
        "private": request.private,
        "auto_init": True
    }
    response = requests.post("https://api.github.com/user/repos", headers=create_headers, json=payload)

    if response.status_code != 201:
        print(f"🔍 GitHub API 오류 응답: {response.status_code}, {response.text}")
        try:
            error_detail = response.json().get("message", "알 수 없는 오류")
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail=f"GitHub 저장소 생성 실패: {error_detail}. 계정 연동을 재확인하세요.")
            raise HTTPException(status_code=response.status_code, detail=error_detail)
        except ValueError:
            raise HTTPException(status_code=response.status_code, detail="GitHub 저장소 생성에 실패했습니다.")

    repo = response.json()
    return {
        "id": repo["id"],
        "full_name": repo["full_name"],
        "description": repo["description"],
        "html_url": repo["html_url"]
    }

@router.get("/github/repos/files/{repo_name:path}")
def get_repo_files(repo_name: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        if not user.github_access_token:
            raise HTTPException(status_code=401, detail="GitHub 계정이 연동되지 않았습니다.")
        
        repo_name = unquote(repo_name)
        if repo_name.startswith("content/"):
            repo_name = repo_name[len("content/"):]
        
        repo_name = repo_name.split("/")[0:2]
        repo_name = "/".join(repo_name)
        
        if not repo_name or "/" not in repo_name:
            print(f"🔍 Invalid repo_name: {repo_name}")
            raise HTTPException(status_code=400, detail="Invalid repository name format. Expected 'owner/repo'.")
        
        print(f"🔍 Fetching files for repo: {repo_name}, token: {user.github_access_token[:10]}...")
        
        g = Github(user.github_access_token)
        repo = g.get_repo(repo_name)
        
        headers = {"Authorization": f"Bearer {user.github_access_token}"}
        user_response = requests.get("https://api.github.com/user", headers=headers)
        if user_response.status_code != 200:
            print(f"🔍 Token validation failed: {user_response.status_code}, {user_response.text}")
            raise HTTPException(status_code=401, detail="Invalid GitHub access token.")

        def fetch_contents(path=""):
            contents = repo.get_contents(path)
            structure = []
            for content in contents:
                item = {
                    "name": content.name,
                    "path": content.path,
                    "type": content.type,
                    "html_url": content.html_url
                }
                if content.type == "dir":
                    item["contents"] = fetch_contents(content.path)
                structure.append(item)
            return structure

        repo_structure = fetch_contents()
        repo_short_name = repo_name.split("/")[-1]
        structure = [{
            "name": repo_short_name,
            "path": "",
            "type": "dir",
            "html_url": f"https://github.com/{repo_name}",
            "contents": repo_structure
        }]
        print(f"🔍 Fetched structure: {len(structure)} items, root={repo_short_name}")
        return {"structure": structure}
    except Exception as e:
        print(f"🔍 Error fetching repo files: {str(e)}")
        raise HTTPException(status_code=404, detail=f"Failed to fetch repository files: {str(e)}")

@router.get("/github/repos/files/content/{repo_name:path}/{file_path:path}")
def get_file_content(repo_name: str, file_path: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        if not user.github_access_token:
            raise HTTPException(status_code=401, detail="GitHub 계정이 연동되지 않았습니다.")
        
        repo_name = unquote(repo_name)
        file_path = unquote(file_path)
        
        if repo_name.startswith("content/"):
            repo_name = repo_name[len("content/"):]
        
        repo_name = repo_name.split("/")[0:2]
        repo_name = "/".join(repo_name)
        
        print(f"🔍 Fetching file content: repo={repo_name}, path={file_path}, token: {user.github_access_token[:10]}...")

        if not repo_name or "/" not in repo_name:
            raise HTTPException(status_code=400, detail="Invalid repository name format. Expected 'owner/repo'.")
        
        raw_url = f"https://raw.githubusercontent.com/{repo_name}/main/{file_path}"
        headers = {
            "Authorization": f"Bearer {user.github_access_token}",
            "Accept": "application/vnd.github.v3.raw"
        }
        
        try:
            response = requests.get(raw_url, headers=headers)
            print(f"🔍 Raw URL request: {raw_url}, status_code={response.status_code}")
            
            if response.status_code != 200:
                print(f"🔍 GitHub Raw API error: {response.status_code}, {response.text}")
                raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch file content: {response.text}")
            
            content = response.text
            content_length = len(content)
            content_preview = content[:100] if content_length > 0 else "Empty file"
            print(f"🔍 File content fetched successfully: {file_path}, content_length={content_length}, content_preview={content_preview}...")
            return {"content": content}
        except Exception as e:
            print(f"🔍 Error fetching file content: {str(e)}")
            raise HTTPException(status_code=404, detail=f"Failed to fetch file content: {str(e)}")
    except Exception as e:
        print(f"🔍 Error fetching file content: {str(e)}")
        raise HTTPException(status_code=404, detail=f"Failed to fetch file content: {str(e)}")

@router.post("/github/repos/upload")
def upload_to_repo(repo_data: UploadRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    repo_name = repo_data.repo_name
    paths = repo_data.paths
    destination_path = repo_data.destination_path.strip("/")
    session_id = str(uuid.uuid4())
    print(f"🔍 Upload request: repo={repo_name}, session_id={session_id}, paths={paths}, destination_path={destination_path}, user_id={user.user_id}")

    if not repo_name or not paths:
        raise HTTPException(status_code=400, detail="Repository name and paths are required")

    if not user.github_access_token:
        raise HTTPException(status_code=401, detail="GitHub 계정이 연동되지 않았습니다.")

    try:
        g = Github(user.github_access_token)
        repo = g.get_repo(repo_name)
        
        if destination_path:
            try:
                repo.get_contents(destination_path)
                print(f"🔍 Destination path exists: {destination_path}")
            except Exception:
                print(f"🔍 Creating directory: {destination_path}")
                repo.create_file(
                    path=f"{destination_path}/.gitkeep",
                    message="Create directory with .gitkeep",
                    content="",
                    branch="main"
                )

        with SESSION_LOCK:
            UPLOAD_SESSIONS[session_id] = {"cancelled": False, "uploaded_paths": []}

        user_dict = {"user_id": user.user_id}

        def upload_file(file_path: str, content: str, message: str):
            with SESSION_LOCK:
                if UPLOAD_SESSIONS.get(session_id, {}).get("cancelled", True):
                    print(f"🔍 Upload cancelled for session: {session_id}, skipping file: {file_path}")
                    raise Exception("Upload cancelled")
            try:
                try:
                    existing_file = repo.get_contents(file_path, ref="main")
                    print(f"🔍 File exists: {file_path}, updating with sha={existing_file.sha}")
                    repo.update_file(
                        path=file_path,
                        message=message,
                        content=content.encode('utf-8'),
                        sha=existing_file.sha,
                        branch="main"
                    )
                except Exception:
                    print(f"🔍 File does not exist: {file_path}, creating new file")
                    repo.create_file(
                        path=file_path,
                        message=message,
                        content=content.encode('utf-8'),
                        branch="main"
                    )
                with SESSION_LOCK:
                    UPLOAD_SESSIONS[session_id]["uploaded_paths"].append(file_path)
            except Exception as e:
                print(f"🔍 File upload error for {file_path}: {str(e)}")
                raise

        def upload_folder(folder_id: int, current_path: str):
            with SESSION_LOCK:
                if UPLOAD_SESSIONS.get(session_id, {}).get("cancelled", True):
                    print(f"🔍 Upload cancelled for session: {session_id}, skipping folder: {folder_id}")
                    raise Exception("Upload cancelled")
            folder = db.query(CodeFolder).filter(
                CodeFolder.folder_id == folder_id,
                CodeFolder.user_id == user_dict["user_id"]
            ).first()
            if not folder:
                print(f"🔍 Folder not found: folder_id={folder_id}")
                raise HTTPException(status_code=404, detail=f"Folder with id {folder_id} not found")

            folder_name = folder.folder_name
            folder_path = f"{current_path}/{folder_name}" if current_path else folder_name
            print(f"🔍 Uploading folder: {folder_name} at {folder_path}")

            codes = get_codes_in_folder(db, user_dict, folder_id)
            for code in codes:
                file_path = f"{folder_path}/{code.title}"
                print(f"🔍 Creating file: {file_path}")
                upload_file(
                    file_path=file_path,
                    content=code.content or "",
                    message=f"Upload {code.title}"
                )

            child_folders = get_child_folders(db, user_dict, folder_id)
            for child_folder in child_folders:
                print(f"🔍 Processing child folder: {child_folder.folder_name} at {folder_path}/{child_folder.folder_name} (folder_id={child_folder.folder_id})")
                upload_folder(child_folder.folder_id, folder_path)

        for path in paths:
            print(f"🔍 Processing path: {path}")
            if path.startswith("folder-"):
                folder_id = int(path.replace("folder-", ""))
                upload_folder(folder_id, destination_path)
            elif path.startswith("code-"):
                code_id = int(path.replace("code-", ""))
                code = get_code_by_id(db, user_dict, code_id)
                if not code:
                    raise HTTPException(status_code=404, detail=f"Code with id {code_id} not found")
                file_path = f"{destination_path}/{code.title}" if destination_path else code.title
                print(f"🔍 Creating file: {file_path}")
                upload_file(
                    file_path=file_path,
                    content=code.content or "",
                    message=f"Upload {code.title}"
                )
            else:
                raise HTTPException(status_code=400, detail=f"Invalid path format: {path}")

        with SESSION_LOCK:
            uploaded_paths = UPLOAD_SESSIONS[session_id]["uploaded_paths"]
            if session_id in UPLOAD_SESSIONS:
                del UPLOAD_SESSIONS[session_id]
        return {"session_id": session_id, "uploaded_paths": uploaded_paths}
    except Exception as e:
        print(f"🔍 Upload error: {str(e)}")
        with SESSION_LOCK:
            if session_id in UPLOAD_SESSIONS:
                del UPLOAD_SESSIONS[session_id]
        raise HTTPException(status_code=400, detail=f"Failed to upload files: {str(e)}")

@router.post("/github/repos/cancel-upload")
def cancel_upload(cancel_data: CancelUploadRequest, user: User = Depends(get_current_user)):
    session_id = cancel_data.session_id
    print(f"🔍 Cancelling upload: session_id={session_id}, repo={cancel_data.repo_name}")
    with SESSION_LOCK:
        if session_id in UPLOAD_SESSIONS:
            UPLOAD_SESSIONS[session_id]["cancelled"] = True
            print(f"🔍 Session marked as cancelled: {session_id}")
            return {"message": f"Upload session {session_id} cancelled"}
        else:
            print(f"🔍 No active session found for: {session_id}")
            raise HTTPException(status_code=404, detail=f"No active upload session found for {session_id}")

@router.post("/github/repos/folder/create")
def create_folder(request: FolderCreateRequest, user: User = Depends(get_current_user)):
    repo_name = request.repo_name
    folder_path = request.folder_path.strip("/")
    print(f"🔍 Creating folder: repo={repo_name}, path={folder_path}, user_id={user.user_id}")

    if not user.github_access_token:
        raise HTTPException(status_code=401, detail="GitHub 계정이 연동되지 않았습니다.")

    if not repo_name or not folder_path:
        raise HTTPException(status_code=400, detail="Repository name and folder path are required")

    try:
        g = Github(user.github_access_token)
        repo = g.get_repo(repo_name)
        gitkeep_path = f"{folder_path}/.gitkeep"
        try:
            repo.get_contents(gitkeep_path)
            print(f"🔍 Folder already exists: {folder_path}")
            raise HTTPException(status_code=400, detail=f"Folder {folder_path} already exists")
        except Exception:
            repo.create_file(
                path=gitkeep_path,
                message=f"Create folder {folder_path}",
                content="",
                branch="main"
            )
            print(f"🔍 Folder created successfully: {folder_path}")
        return {"message": f"Folder {folder_path} created successfully"}
    except Exception as e:
        print(f"🔍 Error creating folder: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to create folder: {str(e)}")

@router.post("/github/repos/file/delete")
def delete_file(request: FileDeleteRequest, user: User = Depends(get_current_user)):
    repo_name = request.repo_name
    path = request.path
    print(f"🔍 Deleting file/folder: repo={repo_name}, path={path}, user_id={user.user_id}")

    if not user.github_access_token:
        raise HTTPException(status_code=401, detail="GitHub 계정이 연동되지 않았습니다.")

    if not repo_name or not path:
        raise HTTPException(status_code=400, detail="Repository name and path are required")

    if path == "":
        raise HTTPException(status_code=400, detail="최상위 폴더는 삭제할 수 없습니다.")

    try:
        g = Github(user.github_access_token)
        repo = g.get_repo(repo_name)
        contents = repo.get_contents(path)
        
        def delete_content(content):
            repo.delete_file(
                path=content.path,
                message=f"Delete {content.path}",
                sha=content.sha,
                branch="main"
            )
            print(f"🔍 Deleted: {content.path}")

        if isinstance(contents, list):
            for content in contents:
                if content.type == "dir":
                    sub_contents = repo.get_contents(content.path)
                    for sub_content in sub_contents:
                        delete_content(sub_content)
                else:
                    delete_content(content)
        else:
            delete_content(contents)
        
        print(f"🔍 Deletion successful: {path}")
        return {"message": f"Successfully deleted {path}"}
    except Exception as e:
        print(f"🔍 Error deleting file/folder: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to delete {path}: {str(e)}")