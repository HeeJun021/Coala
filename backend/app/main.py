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

# 기본 라우트
@app.get("/", tags=["Root"])
def read_root():
    """서버 상태 확인"""
    return {"message": "FastAPI is running!"}
