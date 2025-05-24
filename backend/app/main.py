from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
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
    chat_ws,
    follow,
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
    code,
    coding_tests,
    coding_test_case,
    coding_test_submission,
    problem_starter_code,
    code_execution,
    code_runner,
    code_terminal,
    board,
    preview,
    github,
    chat_rest,
    chat_upload,
    chat_download,
    gpt,
    project,
    erd,
    erd_detail,
    erd_log_action
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
app.include_router(code.router)
app.include_router(preview.router)
app.include_router(github.router)

# 채팅
app.include_router(chat_ws.router)
app.include_router(chat_rest.router)
app.include_router(follow.router)

app.include_router(chat_upload.router, prefix="", tags=["파일 업로드"])
app.include_router(chat_download.router, tags=["파일 다운로드"])

app.mount("/static", StaticFiles(directory="uploaded_files"), name="static")

# gpt
app.include_router(gpt.router, prefix="/gpt", tags=["gpt"])

app.include_router(project.router)

# 프로젝트의 erd
app.include_router(erd.router)
app.include_router(erd_detail.router)
app.include_router(erd_log_action.router)

# 기본 라우트
@app.get("/", tags=["Root"])
def read_root():
    return {"message": "FastAPI is running!"}

