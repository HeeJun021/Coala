from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from urllib.parse import unquote  # ✅ URL 디코딩 추가
from app.database import get_db
from app.models.study_materials import StudyMaterials  # ✅ 중복된 import 제거
from app.models.language import Language
from app.schemas.study_materials import StudyMaterialResponse

router = APIRouter()

# ✅ 특정 언어의 학습 자료 목록 조회
@router.get("/api/materials/{language}", response_model=list[StudyMaterialResponse])
def get_study_materials(language: str, db: Session = Depends(get_db)):
    """특정 언어의 학습자료 가져오기"""
    language_obj = db.query(Language).filter(Language.language == language).first()
    if not language_obj:
        raise HTTPException(status_code=404, detail="해당 언어를 찾을 수 없습니다.")

    materials = db.query(StudyMaterials).filter(StudyMaterials.language_id == language_obj.language_id).all()
    if not materials:
        raise HTTPException(status_code=404, detail="해당 언어의 학습자료를 찾을 수 없습니다.")

    return materials

@router.get("/api/materials/{language}/{material_id}")
def get_study_material(language: str, material_id: int, db: Session = Depends(get_db)):
    """특정 ID의 학습자료 조회"""
    material = db.query(StudyMaterials).filter(StudyMaterials.material_id == material_id).first()

    if not material:
        raise HTTPException(status_code=404, detail="학습 자료를 찾을 수 없습니다.")

    return material

