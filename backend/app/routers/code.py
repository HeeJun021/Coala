# 📍 경로: app/routers/code_folder.py

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.code_models import CodeFolderMapping
from app.routers.auth import get_current_user
from app.schemas.code_schema import CodeFolderResponse, CodeFolderCreate, CodeCreate, CodeResponse, CodeUpdate, CodeTitleUpdate, FolderRename
from app.services.code import (
    get_or_create_root_folder,
    create_child_folder,
    create_code_with_mapping,
    get_root_folder,
    get_child_folders,
    get_codes_in_folder,
    get_code_by_id,
    update_code_content,
    update_code_title,
    update_folder_name,
    delete_code,
    delete_folder_and_contents,
)

router = APIRouter(
    prefix="/freecode",
    tags=["FreeCode"]
)

@router.post("/init-root", response_model=CodeFolderResponse)
def init_root_folder(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    folder = get_or_create_root_folder(db, current_user)
    return folder

@router.post("/folders", response_model=CodeFolderResponse)
def create_folder(
    folder_data: CodeFolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    folder = create_child_folder(
        db=db,
        user=current_user,
        parent_folder_id=folder_data.parent_folder_id,
        folder_name=folder_data.folder_name
    )
    return folder

# 코드 생성
@router.post("/code", response_model=CodeResponse, status_code=status.HTTP_201_CREATED)
def save_code(
    code_data: CodeCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    return create_code_with_mapping(db=db, user=user, code_data=code_data)

# 루트 폴더 조회
@router.get("/folders/root", response_model=CodeFolderResponse)
def read_root_folder(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    folder = get_root_folder(db=db, user=user)
    if not folder:
        raise HTTPException(status_code=404, detail="루트 폴더가 없습니다.")
    return folder

# 하위 폴더 조회
@router.get("/folders/{parent_folder_id}/children", response_model=List[CodeFolderResponse])
def read_child_folders(
    parent_folder_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    return get_child_folders(db=db, user=user, parent_folder_id=parent_folder_id)

# 특정 폴더 안의 코드 파일 목록 조회
@router.get("/folders/{folder_id}/codes", response_model=List[CodeResponse])
def read_codes_in_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    return get_codes_in_folder(db, user, folder_id)

# 개별 코드 파일 조회
@router.get("/codes/{code_id}", response_model=CodeResponse)
def read_code_by_id(
    code_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    return get_code_by_id(db, user, code_id)

# 코드 업데이트
@router.put("/codes/{code_id}", response_model=CodeResponse)
def update_code(
    code_id: int,
    update_data: CodeUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    return update_code_content(db=db, user=user, code_id=code_id, update_data=update_data)

# 코드 이름 수정 (파일이름)
@router.patch("/codes/{code_id}/title", response_model=CodeResponse)
def update_code_title_route(
    code_id: int,
    update_data: CodeTitleUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    return update_code_title(db=db, user=user, code_id=code_id, new_title=update_data.title)

@router.patch("/folders/{folder_id}/rename", response_model=CodeFolderResponse)
def rename_folder(
    folder_id: int,
    data: FolderRename,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    return update_folder_name(db=db, user=user, folder_id=folder_id, new_name=data.folder_name)

# 코드 파일 삭제
@router.delete("/codes/{code_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_code_file(
    code_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    delete_code(db, user, code_id)
    return {"message": "코드 파일이 삭제되었습니다."}

# 폴더 및 내부 코드 삭제
@router.delete("/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    delete_folder_and_contents(db, user, folder_id)
    return {"message": "폴더 및 내부 코드가 삭제되었습니다."}

@router.get("/codes/{code_id}/folder-id")
def get_folder_id_by_code_id(
    code_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    mapping = (
        db.query(CodeFolderMapping)
        .join(Code)
        .filter(CodeFolderMapping.code_id == code_id, Code.user_id == user["id"])
        .first()
    )
    if not mapping:
        raise HTTPException(status_code=404, detail="해당 코드의 폴더를 찾을 수 없습니다.")
    return {"folder_id": mapping.folder_id}