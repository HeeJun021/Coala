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

@router.get("/api/materials/{language}/{id}")
def get_study_material(language: str, id: int, db: Session = Depends(get_db)):
    # ✅ 잘못된 접두어 제거
    if "-" in language:
        language = language.split("-")[-1]  # "예제-html" → "html"

    # ✅ 대소문자 무시하고 언어 찾기
    language_entry = db.query(Language).filter(Language.language.ilike(language)).first()
    
    if not language_entry:
        raise HTTPException(status_code=404, detail="해당 언어가 존재하지 않습니다.")

    # ✅ 개별 자료 조회
    material = db.query(StudyMaterials).filter(
        StudyMaterials.language_id == language_entry.language_id,
        StudyMaterials.material_id == id
    ).first()

    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    return material


