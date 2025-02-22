import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserResponse, UserUpdateSchema
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

# 회원 가입
@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    # 이메일 중복 검사
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다.")

    
    # 비밀번호 해싱
    hashed_password = hash_password(user_data.password)

    # 새 사용자 생성
    new_user = User(
        email=user_data.email,
        password=hashed_password,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user
