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

    # sections 필드에 correct_answer 추가
    for material in materials:
        if material.sections:
            for section in material.sections:
                if section.get("type") == "quiz":
                    # JavaScript 구조 (list)
                    if isinstance(section["content"], list):
                        if "correct_answer" not in section["content"][0]:
                            section["content"][0]["correct_answer"] = section["content"][0]["options"][0]
                    # HTML, CSS 구조 (dict)
                    elif isinstance(section["content"], dict):
                        if "correct_answer" not in section["content"]:
                            section["content"]["correct_answer"] = section["content"]["options"][0]

    return materials

@router.get("/api/materials/{language}/{material_id}")
def get_study_material(language: str, material_id: int, db: Session = Depends(get_db)):
    """특정 ID의 학습자료 조회"""
    material = db.query(StudyMaterials).filter(StudyMaterials.material_id == material_id).first()

    if not material:
        raise HTTPException(status_code=404, detail="학습 자료를 찾을 수 없습니다.")

    # sections 필드에 correct_answer 추가
    if material.sections:
        for section in material.sections:
            if section.get("type") == "quiz":
                # JavaScript 구조 (list)
                if isinstance(section["content"], list):
                    if "correct_answer" not in section["content"][0]:
                        section["content"][0]["correct_answer"] = section["content"][0]["options"][0]
                # HTML, CSS 구조 (dict)
                elif isinstance(section["content"], dict):
                    if "correct_answer" not in section["content"]:
                        section["content"]["correct_answer"] = section["content"]["options"][0]

    return material
