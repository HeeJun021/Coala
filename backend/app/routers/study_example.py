from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from urllib.parse import unquote
from app.database import get_db
from app.models.study_materials import StudyMaterials
from app.models.language import Language
from app.schemas.study_materials import StudyMaterialResponse

router = APIRouter()

@router.get("/api/materials/{language}", response_model=list[StudyMaterialResponse])
def get_study_materials(language: str, db: Session = Depends(get_db)):
    """특정 언어의 학습자료 가져오기"""
    language_obj = db.query(Language).filter(Language.language == language).first()
    if not language_obj:
        raise HTTPException(status_code=404, detail="해당 언어를 찾을 수 없습니다.")

    materials = db.query(StudyMaterials).filter(StudyMaterials.language_id == language_obj.language_id).all()
    if not materials:
        raise HTTPException(status_code=404, detail="해당 언어의 학습자료를 찾을 수 없습니다.")

    # sections 필드에 correct_answer 추가 (예시)
    for material in materials:
        if material.sections:
            for section in material.sections:
                if section.get("type") == "quiz":
                    # correct_answer가 없으면 기본값 추가 (실제로는 DB에서 가져와야 함)
                    if "correct_answer" not in section["content"]:
                        section["content"]["correct_answer"] = section["content"]["options"][0]  # 첫 번째 옵션을 정답으로 설정 (임시)

    return materials

@router.get("/api/materials/{language}/{material_id}")
def get_study_material(language: str, material_id: int, db: Session = Depends(get_db)):
    """특정 ID의 학습자료 조회"""
    material = db.query(StudyMaterials).filter(StudyMaterials.material_id == material_id).first()

    if not material:
        raise HTTPException(status_code=404, detail="학습 자료를 찾을 수 없습니다.")

    # sections 필드에 correct_answer 추가 (예시)
    if material.sections:
        for section in material.sections:
            if section.get("type") == "quiz":
                if "correct_answer" not in section["content"]:
                    section["content"]["correct_answer"] = section["content"]["options"][0]  # 첫 번째 옵션을 정답으로 설정 (임시)

    return material