from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.study_example import StudyExample
from app.models.language import Language

router = APIRouter()

@router.get("/api/examples/{language}")
def get_examples_by_language(language: str, db: Session = Depends(get_db)):
    """특정 언어의 예제 목록을 조회"""
    language_obj = db.query(Language).filter(Language.language == language).first()
    if not language_obj:
        raise HTTPException(status_code=404, detail="해당 언어를 찾을 수 없습니다.")

    examples = db.query(StudyExample).filter(StudyExample.language_id == language_obj.language_id).all()
    if not examples:
        raise HTTPException(status_code=404, detail="해당 언어의 예제를 찾을 수 없습니다.")

    # sections 필드에 correct_answer 추가
    for example in examples:
        if example.sections:
            for section in example.sections:
                if section.get("type") == "quiz":
                    # JavaScript 구조 (list)
                    if isinstance(section["content"], list):
                        if "correct_answer" not in section["content"][0]:
                            section["content"][0]["correct_answer"] = section["content"][0]["options"][0]
                    # HTML, CSS 구조 (dict)
                    elif isinstance(section["content"], dict):
                        if "correct_answer" not in section["content"]:
                            section["content"]["correct_answer"] = section["content"]["options"][0]

    return examples

@router.get("/api/examples/{language}/{example_id}")
def get_study_example_by_id(language: str, example_id: int, db: Session = Depends(get_db)):
    """특정 ID의 예제를 조회"""
    example = db.query(StudyExample).filter(StudyExample.example_id == example_id).first()

    if not example:
        raise HTTPException(status_code=404, detail="해당 예제를 찾을 수 없습니다.")

    # sections 필드에 correct_answer 추가
    if example.sections:
        for section in example.sections:
            if section.get("type") == "quiz":
                # JavaScript 구조 (list)
                if isinstance(section["content"], list):
                    if "correct_answer" not in section["content"][0]:
                        section["content"][0]["correct_answer"] = section["content"][0]["options"][0]
                # HTML, CSS 구조 (dict)
                elif isinstance(section["content"], dict):
                    if "correct_answer" not in section["content"]:
                        section["content"]["correct_answer"] = section["content"]["options"][0]

    return example
