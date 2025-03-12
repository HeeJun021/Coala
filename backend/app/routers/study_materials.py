from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from urllib.parse import unquote  # ✅ URL 디코딩 추가
from app.database import get_db
from app.models.study_materials import StudyMaterials
from app.models.language import Language

router = APIRouter()

# ✅ 특정 언어의 학습 자료 목록 조회
@router.get("/api/materials/{category}")
def get_materials_by_category(category: str, db: Session = Depends(get_db)):
    language = db.query(Language).filter(Language.language == category).first()
    if not language:
        raise HTTPException(status_code=404, detail="해당 카테고리의 자료 없음")

    materials = db.query(StudyMaterials).filter(
        StudyMaterials.language_id == language.language_id
    ).all()

    if not materials:
        raise HTTPException(status_code=404, detail="자료 없음")

    return materials

# ✅ 개별 학습 자료 조회 (title로 조회)
@router.get("/api/materials/{language}/{title}")
def get_study_material(language: str, title: str, db: Session = Depends(get_db)):
    decoded_title = unquote(title)  # ✅ URL 디코딩 적용

    # ✅ 불필요한 prefix 제거 (예: '예제-HTML' → 'HTML')
    if "-" in language:
        language = language.split("-")[-1]

    language_entry = db.query(Language).filter(Language.language.ilike(language)).first()
    if not language_entry:
        raise HTTPException(status_code=404, detail="해당 언어가 존재하지 않습니다.")

    material = db.query(StudyMaterials).filter(
        StudyMaterials.language_id == language_entry.language_id,
        StudyMaterials.title == decoded_title  # ✅ 디코딩된 제목으로 검색
    ).first()

    if not material:
        raise HTTPException(status_code=404, detail="학습 자료를 찾을 수 없습니다.")

    return material
