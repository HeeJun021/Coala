from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import engine, get_db, Base
from app.models import user, email_verification,study_materials,study_example  # ✅ 모든 모델 불러오기
from app.routers import coding_test_case, code_execution, problem_starter_code, user, auth, social_auth,study_materials,study_example  # 사용자 관련 라우터 가져오기
from app.schemas.user import UserUpdateSchema
from datetime import datetime
from sqlalchemy import text
from app.config import settings  # ✅ 설정 불러오기
from app.routers import coding_tests

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ✅ CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # ✅ 프론트엔드 주소 허용
    allow_credentials=True,
    allow_methods=["*"],  # ✅ 모든 HTTP 메소드 허용 (POST, GET, OPTIONS 등)
    allow_headers=["*"],  # ✅ 모든 헤더 허용
)

# 라우터 등록
app.include_router(user.router)
app.include_router(auth.router)
app.include_router(social_auth.router)
app.include_router(coding_tests.router)
app.include_router(problem_starter_code.router)
app.include_router(code_execution.router)
app.include_router(coding_test_case.router)
# app.include_router(study_example.router)
# app.include_router(study_materials.router)

# 기본 라우트
@app.get("/", tags=["Root"])
def read_root():
    """서버 상태 확인"""
    return {"message": "FastAPI is running!"}