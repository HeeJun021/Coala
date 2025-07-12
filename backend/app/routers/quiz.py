from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.services.quiz_service import (
    get_all_quizzes,
    get_quiz,
    create_quiz,
    submit_quiz_logic,
    get_quiz_result_service,
    get_user_quiz_history_service,
    get_quiz_statistics
)
from app.models.question_models import Question
from app.models.quiz_models import Quiz, QuizSubmissions, QuizSubmissionDetails
from app.schemas.quiz_schema import QuizCreate, QuizResponse, QuizResultResponse, QuizSubmissionRequest
from app.schemas.question_schema import QuestionResult
from app.utils.quiz import check_answer 
from app.models.user import User
from app.schemas.eucalyptus_schema import RewardActionType
from app.services.user import reward_user_by_action

router = APIRouter(
    prefix="/quizzes",
    tags=["quizzes"]
)

# 1모든 퀴즈 조회 API
@router.get("/", response_model=List[QuizResponse])
def get_all(db: Session = Depends(get_db)):
    return get_all_quizzes(db)

@router.get("/stats")
def get_quiz_stats(user_id: int = Query(...), db: Session = Depends(get_db)):
    return get_quiz_statistics(user_id, db)

@router.get("/{quiz_id}")
def fetch_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = get_quiz(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="해당 ID의 퀴즈를 찾을 수 없습니다.")

    return quiz

# 퀴즈 생성 API
@router.post("/", response_model=QuizResponse)
def create(quiz_data: QuizCreate, db: Session = Depends(get_db)):
    return create_quiz(
        db=db,
        title=quiz_data.title,
        quiz_type=quiz_data.quiz_type,
        language_id=quiz_data.language_id, 
        settings=quiz_data.settings
    )

@router.post("/{quiz_id}/submit")
def submit_quiz(quiz_id: int, submission_data: QuizSubmissionRequest, db: Session = Depends(get_db)):
    return submit_quiz_logic(submission_data=submission_data, db=db)

@router.get("/{quiz_id}/result/{user_id}", response_model=QuizResultResponse)
def get_quiz_result(quiz_id: int, user_id: int, db: Session = Depends(get_db)):
    return get_quiz_result_service(quiz_id, user_id, db)

@router.get("/history/{user_id}")
def get_user_quiz_history(user_id: int, db: Session = Depends(get_db)):
    return get_user_quiz_history_service(user_id, db)

