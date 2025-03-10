from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.services.question import get_all_questions, get_random_questions, get_question_by_id
from app.schemas.question import QuestionResponse

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

@router.get("/{question_id}", response_model=QuestionResponse)
def get_one(question_id: int, db: Session = Depends(get_db)):
    question = get_question_by_id(db, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다.")
    return question
