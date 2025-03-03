from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.study_materials import StudyMaterials
from app.models.language import Language  # ✅ 언어 테이블 추가

router = APIRouter()


# ✅ 특정 카테고리(language_id)에 해당하는 자료 조회
@router.get("/api/materials/{category}")
def get_materials_by_category(category: str, db: Session = Depends(get_db)):
    language = db.query(Language).filter(Language.language == category).first()

    if not language:
        raise HTTPException(status_code=404, detail="해당 카테고리의 자료 없음")

    materials = db.query(StudyMaterials).filter(StudyMaterials.language_id
                                                == language.language_id).all()

    if not materials:
        raise HTTPException(status_code=404, detail="자료 없음")

    return materials
