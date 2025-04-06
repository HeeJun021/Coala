from fastapi import APIRouter, HTTPException, Path, Depends
from sqlalchemy.orm import Session
from app.schemas.coding_tests import ProblemStarterCodeResponse
from app.models.coding_tests import problemstartercode
from app.database import get_db

router = APIRouter()


@router.get("/problem-starter-code/{test_id}/{language}", response_model=ProblemStarterCodeResponse)
def get_problem_starter_code(
    test_id: int = Path(..., description="문제 ID"),
    language: str = Path(..., description="프로그래밍 언어"),
    db: Session = Depends(get_db)
):
    starter_code = (
        db.query(problemstartercode)
        .filter(problemstartercode.test_id == test_id, problemstartercode.language == language)
        .first()
    )
    if not starter_code:
        raise HTTPException(status_code=404, detail="Starter code not found for this test and language.")

    return starter_code
