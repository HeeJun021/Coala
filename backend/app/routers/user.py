import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdateSchema
from app.services.user import get_user_by_id, update_user_info
from app.utils.security import hash_password

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/{user_id}", response_model=UserResponse)
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

# ✅ 회원가입 API 수정 (이메일 인증 확인 추가)
@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    # 1️⃣ 이메일이 `users` 테이블에 있는지 확인 (이메일 인증 후 자동 추가됨)
    existing_user = db.query(User).filter(User.email == user_data.email).first()

    # 2️⃣ 이메일 인증이 안 된 경우 회원가입 불가
    if not existing_user:
        raise HTTPException(status_code=400, detail="이메일 인증이 필요합니다.")

    if existing_user.email_verified is False:
        raise HTTPException(status_code=400, detail="이메일 인증이 완료되지 않았습니다.")

    # 3️⃣ 이메일 인증된 사용자는 추가 정보 입력 후 비밀번호 저장
    existing_user.password = hash_password(user_data.password)
    existing_user.nickname = user_data.nickname
    existing_user.birth_date = user_data.birth_date
    existing_user.email_verified = True  # 다시 확인 (혹시나 False로 남아 있을 경우)

    db.commit()
    db.refresh(existing_user)

    return existing_user
