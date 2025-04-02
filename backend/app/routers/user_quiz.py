from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.user_quiz import UserQuizCreate, UserQuizCreateResponse
from app.services.user_quiz_service import create_user_quiz
from sqlalchemy.orm import Session

router = APIRouter(prefix="/user-quiz", tags=["User Quiz"])

@router.post("/create", response_model=UserQuizCreateResponse)
def create_user_quiz_endpoint(
    quiz_data: UserQuizCreate,
    db: Session = Depends(get_db)
):
    result = create_user_quiz(quiz_data, db)
    return result