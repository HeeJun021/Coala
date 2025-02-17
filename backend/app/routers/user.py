from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserResponse, UserUpdateSchema
from app.services.user import get_user_by_id, update_user_info

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# 사용자 정보 수정 (닉네임, 자기소개, 개발 직군 수정)
@router.put("/{user_id}")
def update_user(user_id: str, user_update: UserUpdateSchema, db: Session = Depends(get_db)):
    updated_user = update_user_info(db, user_id, user_update)
    return updated_user
