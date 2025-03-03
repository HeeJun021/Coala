from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.study_example import StudyExample
from app.models.language import Language

router = APIRouter()


@router.get("/api/examples/{category}")
def get_examples_by_category(category: str, db: Session = Depends(get_db)):
    # ✅ 카테고리에 해당하는 언어 ID 찾기
    language = db.query(Language).filter(Language.language == category).first()
    if not language:
        raise HTTPException(status_code=404, detail="해당 언어가 존재하지 않습니다.")

    # ✅ 해당 언어의 예제 데이터 가져오기
    examples = db.query(StudyExample).filter(StudyExample.language_id
                                             == language.language_id).all()
    if not examples:
        raise HTTPException(status_code=404, detail="예제 데이터가 없습니다.")

    return examples
