# 📍 경로: app/services/code_folder_service.py

from sqlalchemy.orm import Session
from app.models.code import CodeFolder
from app.models.user import User
from datetime import datetime

def get_or_create_root_folder(db: Session, user: dict) -> CodeFolder:
    """
    사용자의 최상위(루트) 폴더가 없으면 생성하고 반환합니다.
    """
    user_id = user["user_id"]

    folder = (
        db.query(CodeFolder)
        .filter(CodeFolder.user_id == user_id)
        .filter(CodeFolder.parent_folder_id.is_(None))
        .first()
    )

    if folder:
        return folder

    # user_folder_index = 1부터 시작
    next_index = (
        db.query(CodeFolder)
        .filter(CodeFolder.user_id == user_id)
        .count() + 1
    )

    new_folder = CodeFolder(
        user_id=user_id,
        folder_name="내 코드",
        user_folder_index=next_index,
        parent_folder_id=None,
        created_at=datetime.utcnow(),
    )

    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)

    return new_folder