# 📍 경로: app/routers/code_folder.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.code import CodeFolderResponse
from app.services.code import get_or_create_root_folder

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
