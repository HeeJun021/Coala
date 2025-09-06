from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.services.question import get_all_questions, get_random_questions, get_question_by_id
from app.schemas.question_schema import QuestionResponse
from app.services.quiz_service import get_user_incorrect_questions_service
from app.schemas.quiz_schema import IncorrectQuestionResponse
from app.dependencies.auth import get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/questions",
    tags=["Questions"]
)

@router.get("/", response_model=List[QuestionResponse])
def get_all(db: Session = Depends(get_db)):
    return get_all_questions(db)

@router.get("/random", response_model=List[QuestionResponse])
def get_random(count: int, types: Optional[str] = None, difficulty: Optional[int] = None, db: Session = Depends(get_db)):
    type_list = [int(t) for t in types.split(",")] if types else []
    return get_random_questions(db, count, type_list, difficulty)

@router.get(
    "/incorrect",
    response_model=List[IncorrectQuestionResponse],
    summary="내가 틀렸던 문제 목록 조회 (오답 노트)",
    description="현재 로그인한 사용자가 퀴즈를 풀면서 틀렸던 모든 문제의 목록과 틀린 횟수를 반환합니다. `language_id`로 필터링할 수 있습니다."
)
def get_my_incorrect_questions(
    language_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    incorrect_questions = get_user_incorrect_questions_service(
        user_id=current_user.user_id, 
        db=db,
        language_id=language_id 
    )
    return incorrect_questions

@router.get("/{question_id}", response_model=QuestionResponse)
def get_one(question_id: int, db: Session = Depends(get_db)):
    question = get_question_by_id(db, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다.")
    return question


