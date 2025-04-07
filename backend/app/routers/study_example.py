from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.study_example import StudyExample
from app.models.language import Language
from app.models.exampleread import examplereads
from app.models.user import User
from app.dependencies.auth import get_current_user  # ✅ JWT 인증 유틸 불러오기
from sqlalchemy.exc import IntegrityError
from fastapi import status

router = APIRouter()

@router.get("/api/examples/{language}")
def get_examples_by_language(
    language: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)  # ✅ 로그인 사용자 (없으면 None)
):
    """특정 언어의 예제 목록 조회 (로그인 시 완료 여부 포함)"""
    language_obj = db.query(Language).filter(Language.language == language).first()
    if not language_obj:
        raise HTTPException(status_code=404, detail="해당 언어를 찾을 수 없습니다.")

    examples = db.query(StudyExample).filter(StudyExample.language_id == language_obj.language_id).all()

    completed_id_set = set()
    if current_user:
        completed_ids = db.query(examplereads.example_id).filter(
            examplereads.user_id == current_user.user_id
        ).all()
        completed_id_set = {e_id[0] for e_id in completed_ids}

    result = []
    for example in examples:
        # ✅ 정답 보정
        if example.sections:
            for section in example.sections:
                if section.get("type") == "quiz":
                    if isinstance(section["content"], list):
                        if "correct_answer" not in section["content"][0]:
                            section["content"][0]["correct_answer"] = section["content"][0]["options"][0]
                    elif isinstance(section["content"], dict):
                        if "correct_answer" not in section["content"]:
                            section["content"]["correct_answer"] = section["content"]["options"][0]

        result.append({
            "example_id": example.example_id,
            "title": example.title,
            "content": example.content,
            "language_id": example.language_id,
            "sections": example.sections,
            "is_completed": example.example_id in completed_id_set
        })

    return result


@router.get("/api/examples/{language}/{example_id}")
def get_study_example_by_id(
    language: str,
    example_id: int,
    db: Session = Depends(get_db)
):
    """특정 ID의 예제를 조회"""
    example = db.query(StudyExample).filter(StudyExample.example_id == example_id).first()

    if not example:
        raise HTTPException(status_code=404, detail="해당 예제를 찾을 수 없습니다.")

    if example.sections:
        for section in example.sections:
            if section.get("type") == "quiz":
                if isinstance(section["content"], list):
                    if "correct_answer" not in section["content"][0]:
                        section["content"][0]["correct_answer"] = section["content"][0]["options"][0]
                elif isinstance(section["content"], dict):
                    if "correct_answer" not in section["content"]:
                        section["content"]["correct_answer"] = section["content"]["options"][0]

    return example

@router.post("/api/examples/{example_id}/complete", status_code=status.HTTP_204_NO_CONTENT)
def mark_example_as_completed(
    example_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    if not current_user:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

    try:
        # ✅ ORM 방식으로 학습 완료 기록
        db.add(examplereads(user_id=current_user.user_id, example_id=example_id))
        db.commit()
    except IntegrityError:
        db.rollback()

    return  # 204 No Content