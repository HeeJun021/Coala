from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.study_materials_models import StudyMaterials
from app.models.studymaterialread_models import studymaterialreads
from app.models.language import Language
from app.schemas.study_materials_schema import StudyMaterialResponse
from app.models.user import User
from app.dependencies.auth import get_current_user
from fastapi import status
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_, cast, String
from app.models.study_example_models import StudyExample

router = APIRouter()

@router.get("/api/materials/{language}", response_model=list[StudyMaterialResponse])
def get_study_materials(
    language: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """특정 언어의 학습자료 가져오기 (+ 로그인 시 완료 여부 포함)"""
    language_obj = db.query(Language).filter(Language.language == language).first()
    if not language_obj:
        raise HTTPException(status_code=404, detail="해당 언어를 찾을 수 없습니다.")

    materials = db.query(StudyMaterials).filter(StudyMaterials.language_id == language_obj.language_id).order_by(StudyMaterials.order).all()

    completed_id_set = set()
    if current_user:
        completed_ids = db.query(studymaterialreads.material_id).filter(
            studymaterialreads.user_id == current_user.user_id
        ).all()
        completed_id_set = {m_id[0] for m_id in completed_ids}

    result = []
    for material in materials:
        if material.sections:
            for section in material.sections:
                if section.get("type") == "quiz":
                    if isinstance(section["content"], list):
                        if "correct_answer" not in section["content"][0]:
                            section["content"][0]["correct_answer"] = section["content"][0]["options"][0]
                    elif isinstance(section["content"], dict):
                        if "correct_answer" not in section["content"]:
                            section["content"]["correct_answer"] = section["content"]["options"][0]

        result.append({
            "material_id": material.material_id,
            "title": material.title,
            "content": material.content,
            "language_id": material.language_id,
            "sections": material.sections,
            "is_completed": material.material_id in completed_id_set
        })

    return result

@router.get("/api/materials/{language}/{id}")
def get_study_material_by_id(language: str, id: int, db: Session = Depends(get_db)):
    material = db.query(StudyMaterials).filter(StudyMaterials.material_id == id).first()
    if not material:
        raise HTTPException(status_code=404, detail="해당 학습자료를 찾을 수 없습니다.")

    if material.sections:
        for section in material.sections:
            if section.get("type") == "quiz":
                if isinstance(section["content"], list):
                    if "correct_answer" not in section["content"][0]:
                        section["content"][0]["correct_answer"] = section["content"][0]["options"][0]
                elif isinstance(section["content"], dict):
                    if "correct_answer" not in section["content"]:
                        section["content"]["correct_answer"] = section["content"]["options"][0]
    return material

@router.post("/api/study/material/{material_id}/complete", status_code=status.HTTP_204_NO_CONTENT)
def mark_material_completed(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

    try:
        db.add(studymaterialreads(user_id=current_user.user_id, material_id=material_id))
        db.commit()
    except IntegrityError:
        db.rollback()

    return

@router.get("/api/study/search")
def search_study(
    q: str,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """
    학습자료(StudyMaterials) + 예제(StudyExample) 통합 검색
    - title / content / sections(JSONB::text) ILIKE
    - 언어명(Language.language) 포함
    """
    kw = f"%{q}%"

    # Materials
    mats = (
        db.query(
            StudyMaterials.material_id.label("id"),
            Language.language.label("language"),
            StudyMaterials.title.label("title"),
            StudyMaterials.content.label("content"),
            cast(StudyMaterials.sections, String).label("sections"),
        )
        .join(Language, Language.language_id == StudyMaterials.language_id)
        .filter(
            or_(
                StudyMaterials.title.ilike(kw),
                StudyMaterials.content.ilike(kw),
                cast(StudyMaterials.sections, String).ilike(kw),
            )
        )
        .limit(limit)
        .all()
    )

    # Examples
    exs = (
        db.query(
            StudyExample.example_id.label("id"),
            Language.language.label("language"),
            StudyExample.title.label("title"),
            StudyExample.content.label("content"),
            cast(StudyExample.sections, String).label("sections"),
        )
        .join(Language, Language.language_id == StudyExample.language_id)
        .filter(
            or_(
                StudyExample.title.ilike(kw),
                StudyExample.content.ilike(kw),
                cast(StudyExample.sections, String).ilike(kw),
            )
        )
        .limit(limit)
        .all()
    )

    def make_snippet(title: str, content: str, sections: str, q: str, size: int = 120):
        pool = " ".join(
            [s for s in [title or "", content or "", sections or ""] if s]
        )
        lower = pool.lower()
        idx = lower.find(q.lower())
        if idx < 0:
            return (pool[:size] + ("…" if len(pool) > size else "")).strip()
        start = max(0, idx - 40)
        end = min(len(pool), idx + len(q) + 80)
        return (pool[start:end] + ("…" if end < len(pool) else "")).strip()

    results = []
    for r in mats:
        results.append(
            {
                "item_type": "material",
                "id": r.id,
                "language": r.language,
                "title": r.title,
                "snippet": make_snippet(r.title, r.content, r.sections, q),
            }
        )
    for r in exs:
        results.append(
            {
                "item_type": "example",
                "id": r.id,
                "language": r.language,
                "title": r.title,
                "snippet": make_snippet(r.title, r.content, r.sections, q),
            }
        )

    # 간단 정렬: 언어 -> 타입 -> 제목
    results.sort(key=lambda x: (x["language"].lower(), x["item_type"], x["title"].lower()))
    return results