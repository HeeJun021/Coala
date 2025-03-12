from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from urllib.parse import unquote  # ✅ URL 디코딩 추가
from app.database import get_db
from app.models.study_example import StudyExample
from app.models.language import Language

router = APIRouter()

# ✅ 특정 언어의 예제 목록 조회
@router.get("/api/examples/{category}")
def get_examples_by_category(category: str, db: Session = Depends(get_db)):
    language = db.query(Language).filter(Language.language == category).first()
    if not language:
        raise HTTPException(status_code=404, detail="해당 언어가 존재하지 않습니다.")

    examples = db.query(StudyExample).filter(
        StudyExample.language_id == language.language_id
    ).all()

    if not examples:
        raise HTTPException(status_code=404, detail="예제 데이터가 없습니다.")

    return examples

# ✅ 개별 예제 조회 (title로 조회)
@router.get("/api/examples/{language}/{title}")
def get_study_example(language: str, title: str, db: Session = Depends(get_db)):
    decoded_title = unquote(title)  # ✅ URL 디코딩 적용

    # ✅ 불필요한 prefix 제거
    if "-" in language:
        language = language.split("-")[-1]

    language_entry = db.query(Language).filter(Language.language.ilike(language)).first()
    if not language_entry:
        raise HTTPException(status_code=404, detail="해당 언어가 존재하지 않습니다.")

    example = db.query(StudyExample).filter(
        StudyExample.language_id == language_entry.language_id,
        StudyExample.title == decoded_title  # ✅ 디코딩된 제목으로 검색
    ).first()

    if not example:
        raise HTTPException(status_code=404, detail="예제를 찾을 수 없습니다.")

    return example
