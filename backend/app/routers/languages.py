from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.language import Language  # ✅ 기존에 작성된 models/language.py 활용

router = APIRouter()

@router.get("/languages")  # ✅ 기존 방식과 동일하게 API 추가
def get_languages(db: Session = Depends(get_db)):
    return db.query(Language).all()
