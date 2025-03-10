from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.services.quiz import get_all_quizzes, get_quiz, create_quiz
from app.schemas.quiz import QuizCreate, QuizResponse

router = APIRouter(
    prefix="/quizzes",
    tags=["quizzes"]
)

# 1️⃣ 모든 퀴즈 조회 API
@router.get("/", response_model=List[QuizResponse])
def get_all(db: Session = Depends(get_db)):
    return get_all_quizzes(db)

# 2️⃣ 특정 퀴즈 조회 API
@router.get("/{quiz_id}", response_model=QuizResponse)
def get_one(quiz_id: int, db: Session = Depends(get_db)):
    quiz = get_quiz(quiz_id, db)
    if not quiz:
        raise HTTPException(status_code=404, detail="퀴즈를 찾을 수 없습니다.")
    return quiz

# 3️⃣ 퀴즈 생성 API
@router.post("/", response_model=QuizResponse)
def create(quiz_data: QuizCreate, db: Session = Depends(get_db)):
    return create_quiz(db, quiz_data.title, quiz_data.quiz_type, quiz_data.settings)
