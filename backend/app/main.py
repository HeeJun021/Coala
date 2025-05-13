from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import engine, get_db, Base

# ✅ 모델 불러오기
from app.models import (
    user,
    email_verification,
    study_materials,
    study_example,
    question,
    language
)

# ✅ 라우터 불러오기
from app.routers import (
    user,
    auth,
    social_auth,
    study_materials,
    study_example,
    question,
    quiz,
    user_quiz,
    wrong_note,
    languages,
    coding_tests,
    coding_test_case,
    coding_test_submission,
    problem_starter_code,
    code_execution,
    code_runner,
    code_terminal,
    board
)
from app.schemas.user import UserUpdateSchema
from datetime import datetime
from sqlalchemy import text
from app.config import settings

from fastapi.middleware.cors import CORSMiddleware

# DB 초기화
Base.metadata.create_all(bind=engine)

app = FastAPI()

# ✅ CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ 라우터 등록

# 라우터 등록
app.include_router(board.router)

app.include_router(user.router)
app.include_router(auth.router)
app.include_router(social_auth.router)
app.include_router(languages.router)

app.include_router(study_example.router)
app.include_router(study_materials.router)

app.include_router(question.router)
app.include_router(quiz.router)
app.include_router(user_quiz.router)
app.include_router(coding_tests.router)
app.include_router(problem_starter_code.router)
app.include_router(code_execution.router)
app.include_router(coding_test_case.router)
app.include_router(wrong_note.router)
app.include_router(coding_test_submission.router)
app.include_router(code_runner.router)
app.include_router(code_terminal.router)
app.include_router(code_execution.router, prefix="/code")  # WebSocket용이면 prefix 유지 가능

# 기본 라우트
@app.get("/", tags=["Root"])
def read_root():
    return {"message": "FastAPI is running!"}

