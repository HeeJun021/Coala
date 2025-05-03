# app/routers/code.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.models.code import Code, CodeFolder, CodeFolderMapping  # ✅ 올바른 위치
from app.schemas.code import (
    TemplateFile,
    TemplateRequest,
    TemplateResponse,
    RenameRequest,
    DeleteRequest
)
from app.database import get_db
from app.services.code import get_or_create_root_folder, create_code_template_structure, build_folder_tree
from app.models.user import User
from app.dependencies.auth import get_current_user

router = APIRouter(tags=["FreeCode"])

@router.post("/create-template", response_model=TemplateResponse)
def create_template_from_click(
    payload: TemplateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. 사용자 루트 폴더 확보
    root_folder = get_or_create_root_folder(db, current_user.user_id)

    # 2. 템플릿 폴더 생성 및 파일 저장
    folder = create_code_template_structure(
        db=db,
        user_id=current_user.user_id,
        template_name=payload.template_name,
        files=payload.files,
        parent_folder_id=root_folder.folder_id
    )

    return TemplateResponse(
        folder_id=folder.folder_id,
        folder_name=folder.folder_name
    )

@router.get("/load-structure")
def load_user_code_structure(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    로그인한 사용자의 폴더 및 코드 구조를 계층적으로 반환
    """
    folder_tree = build_folder_tree(db, current_user.user_id)
    return {"folders": folder_tree}

@router.delete("/delete")
def delete_item(
    payload: DeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item_id = payload.item_id
    item_type = payload.item_type
    if item_type == "file":
        code = db.query(Code).filter(Code.code_id == item_id, Code.user_id == current_user.user_id).first()
        if not code:
            raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
        db.query(CodeFolderMapping).filter(CodeFolderMapping.code_id == item_id).delete()
        db.delete(code)
    elif item_type == "folder":
        folder = db.query(CodeFolder).filter(CodeFolder.folder_id == item_id, CodeFolder.user_id == current_user.user_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="폴더를 찾을 수 없습니다.")
        db.delete(folder)
    else:
        raise HTTPException(status_code=400, detail="잘못된 항목 타입입니다.")
    db.commit()
    return {"message": "삭제 완료"}

@router.put("/rename")
def rename_item(
    payload: RenameRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if payload.item_type == "file":
        code = db.query(Code).filter(Code.code_id == payload.item_id, Code.user_id == current_user.user_id).first()
        if not code:
            raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
        code.title = payload.new_name
    elif payload.item_type == "folder":
        folder = db.query(CodeFolder).filter(CodeFolder.folder_id == payload.item_id, CodeFolder.user_id == current_user.user_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="폴더를 찾을 수 없습니다.")
        folder.folder_name = payload.new_name
    else:
        raise HTTPException(status_code=400, detail="잘못된 항목 타입입니다.")

    db.commit()
    return {"message": "이름 변경 완료"}