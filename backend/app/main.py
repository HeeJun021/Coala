from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import engine, get_db, Base
from app.models import user, email_verification  # ✅ 모든 모델 불러오기
from app.routers import user, auth  # 사용자 관련 라우터 가져오기
from app.schemas.user import UserUpdateSchema
from datetime import datetime
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware

from starlette.middleware.sessions import SessionMiddleware  # ✅ Starlette에서 가져오기
from app.config import settings  # ✅ 설정 불러오기


app = FastAPI()

# ✅ 환경 변수 확인 (테스트용 로그 - 필요 없으면 제거 가능)
print(f"🔑 SECRET_KEY: {settings.SECRET_KEY}")
print(f"🍪 SESSION_COOKIE_NAME: {settings.SESSION_COOKIE_NAME}")

# 🔥 세션 미들웨어 추가 (환경 변수 적용)
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,  
    session_cookie=settings.SESSION_COOKIE_NAME  
)

# 🔥 CORS 미들웨어 추가 (프론트엔드 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 도메인 허용 (실제 운영에서는 특정 프론트엔드 URL로 제한할 것)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(user.router)
app.include_router(auth.router)

# 기본 라우트
@app.get("/", tags=["Root"])
def read_root():
    """서버 상태 확인"""
    return {"message": "FastAPI is running!"}
