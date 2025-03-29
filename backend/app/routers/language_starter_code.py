from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.coding_tests import LanguageStarterCode
from app.database import get_db

router = APIRouter(prefix="/language-starter-code", tags=["Language Starter Code"])

@router.get("/{language}")
def get_starter_code(language: str, db: Session = Depends(get_db)):
    print(f"요청 받은 언어: {language}")
    starter = db.query(LanguageStarterCode).filter(
        func.lower(LanguageStarterCode.language) == language.lower()
    ).first()
    if not starter:
        raise HTTPException(status_code=404, detail="해당 언어의 스타터 코드가 없습니다.")
    return {
        "language": starter.language,
        "code": starter.code
    }
