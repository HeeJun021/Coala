import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.utils.security import hash_password

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    # 아이디 중복 검사
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="이미 사용 중인 아이디입니다.")

    # 이메일 중복 검사
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다.")

    # 전화번호 중복 검사
    existing_phone = db.query(User).filter(User.phone_number == user_data.phone_number).first()
    if existing_phone:
        raise HTTPException(status_code=400, detail="이미 사용 중인 전화번호입니다.")
    
    # 비밀번호 해싱
    hashed_password = hash_password(user_data.password)

    # 새 사용자 생성
    new_user = User(
        user_id=str(uuid.uuid4()),  # UUID 자동 생성
        username=user_data.username,
        email=user_data.email,
        password=hashed_password,
        phone_number=user_data.phone_number,
        birth_date=user_data.birth_date
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user