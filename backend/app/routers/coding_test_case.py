from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.coding_test_case_service import get_testcases

router = APIRouter(prefix="/codingtest", tags=["Coding Test"])

@router.get("/{test_id}/testcases")
def fetch_testcases(test_id: int, type: str = "public", db: Session = Depends(get_db)):
    return get_testcases(db, test_id, type)
