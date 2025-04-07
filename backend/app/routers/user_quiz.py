from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.schemas.user_quiz import (
    UserQuizCreate,
    UserQuizCreateResponse,
    UserQuizDetail,
    UserQuizSubmitRequest,
    UserQuizSubmitResponse,
    UserQuizResultResponse,
    UserQuizHistoryResponse,
)
from app.services import user_quiz_service

router = APIRouter(prefix="/user-quiz", tags=["User Quiz"])

@router.post("/create", response_model=UserQuizCreateResponse)
def create_user_quiz_endpoint(quiz_data: UserQuizCreate, db: Session = Depends(get_db)):
    return user_quiz_service.create_user_quiz(quiz_data, db)

@router.get("/user-quizzes")
def get_user_quizzes(
    search: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    return user_quiz_service.get_all_user_quizzes(db, search, user_id)

@router.get("/{userquiz_id}", response_model=UserQuizDetail)
def get_user_quiz_detail(userquiz_id: int, db: Session = Depends(get_db)):
    return user_quiz_service.get_user_quiz_detail(userquiz_id, db)

@router.post("/submit", response_model=UserQuizSubmitResponse)
def submit_user_quiz(data: UserQuizSubmitRequest, db: Session = Depends(get_db)):
    return user_quiz_service.submit_user_quiz(data, db)

@router.get("/result/{uq_submission_id}", response_model=UserQuizResultResponse)
def get_user_quiz_result(uq_submission_id: int, db: Session = Depends(get_db)):
    return user_quiz_service.get_user_quiz_result_service(uq_submission_id, db)

@router.get("/userquiz-history/{user_id}", response_model=UserQuizHistoryResponse)
def get_user_quiz_history(user_id: int, db: Session = Depends(get_db)):
    return user_quiz_service.get_user_quiz_history(db, user_id)
