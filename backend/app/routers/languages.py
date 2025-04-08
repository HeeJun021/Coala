from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.language import Language

router = APIRouter()

@router.get("/languages")  # ✅ GET 요청이 /api/languages로 설정됨
def get_languages(db: Session = Depends(get_db)):
    """모든 프로그래밍 언어 목록 가져오기"""
    languages = db.query(Language).all()
    if not languages:
        raise HTTPException(status_code=404, detail="언어 데이터가 없습니다.")

    return [{"language_id": lang.language_id, "language": lang.language} for lang in languages]
