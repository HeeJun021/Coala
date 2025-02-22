from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import engine, get_db
from app.models.user import User
from app.routers import user  # 사용자 관련 라우터 가져오기
from app.schemas.user import UserUpdateSchema
from datetime import datetime
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware

# from app.routers import auth  # 로그인 관련 라우터 (새로 만들 예정)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프론트엔드 주소 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(user.router)

# app.include_router(auth.router)  # auth.py에서 라우터를 설정할 예정

# 데이터베이스 연결 테스트 API
@app.get("/db-test", tags=["Database"])
def db_test():
    """데이터베이스 연결 테스트"""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "✅ Database Connected"}
    except Exception as e:
        return {"status": "❌ Database Connection Failed", "error": str(e)}

# 사용자 정보 가져오기 API
@app.get("/users/{user_id}", tags=["Users"])
def get_user(user_id: str, db: Session = Depends(get_db)):
    """
    🔹 특정 사용자 정보를 가져옵니다.
    - `user_id`: 조회할 사용자 ID
    """
    user = db.query(User).filter(User.user_id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="❌ User not found")

    return {
        "user_id": user.user_id,
        "username": user.username,
        "email": user.email,
        "email_verified": user.email_verified,
        "phone_number": user.phone_number,
        "rating": user.rating,
        "status": user.status,
        "created_at": user.created_at,
        "tier_id": user.tier_id
    }

# ✅ 사용자 정보 업데이트 API 추가
@app.put("/users/{user_id}", tags=["Users"])
def update_user(user_id: str, user_update: UserUpdateSchema, db: Session = Depends(get_db)):
    """
    🔹 특정 사용자의 닉네임, 자기소개, 개발 직군을 업데이트합니다.
    """
    user = db.query(User).filter(User.user_id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 사용자 정보 업데이트
    user.username = user_update.username
    user.bio = user_update.bio
    user.role = user_update.role
    user.updated_at = datetime.now()
    
    db.commit()
    db.refresh(user)

    return {"message": "✅ User updated successfully"}

# 기본 라우트
@app.get("/", tags=["Root"])
def read_root():
    """서버 상태 확인"""
    return {"message": "FastAPI is running!"}
