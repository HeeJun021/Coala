from fastapi import APIRouter, HTTPException, Path, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.schemas.coding_tests_schema import ProblemStarterCodeResponse, PreferredLangUpdate
from app.models.coding_tests_models import problemstartercode
from app.models.user import User
from app.database import get_db
from app.routers.auth import get_current_user

router = APIRouter()

# ============================
# 기존: 특정 언어 스타터 코드 조회
# ============================
@router.get("/problem-starter-code/{test_id:int}/{language}", response_model=ProblemStarterCodeResponse)
def get_problem_starter_code(
    test_id: int = Path(..., description="문제 ID"),
    language: str = Path(..., description="프로그래밍 언어"),
    db: Session = Depends(get_db)
):
    starter_code = (
        db.query(problemstartercode)
        .filter(problemstartercode.test_id == test_id, problemstartercode.language == language)
        .first()
    )
    if not starter_code:
        raise HTTPException(status_code=404, detail="Starter code not found for this test and language.")

    return starter_code


# ============================
# 추가: 언어 생략 시 선호 언어/기본 python 적용
# ============================
@router.get("/problem-starter-code/{test_id:int}", response_model=ProblemStarterCodeResponse)
def get_problem_starter_code_by_preference(
    test_id: int = Path(..., description="문제 ID"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # 사용자 선호 언어 → 없으면 python
    user = db.query(User).filter(User.user_id == current_user["user_id"]).first()
    preferred = (user.preferred_coding_lang or "python").lower() if user else "python"

    # 1) 선호 언어 시도
    starter = (
        db.query(problemstartercode)
        .filter(problemstartercode.test_id == test_id, problemstartercode.language.ilike(preferred))
        .first()
    )
    if starter:
        return starter

    # 2) python으로 폴백
    if preferred != "python":
        starter = (
            db.query(problemstartercode)
            .filter(problemstartercode.test_id == test_id, problemstartercode.language.ilike("python"))
            .first()
        )
        if starter:
            return starter

    raise HTTPException(status_code=404, detail="Starter code not found for preferred/python language.")


# ============================
# 추가: 사용자 선호 언어 변경
# ============================
@router.patch("/problem-starter-code/me/preferred-language")
def update_preferred_language(
    payload: PreferredLangUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    lang = (payload.language or "").lower().strip()
    if lang not in ("python", "java", "javascript"):
        raise HTTPException(status_code=400, detail="language must be one of: python | java | javascript")

    user = db.query(User).filter(User.user_id == current_user["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.preferred_coding_lang = lang
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"result": "success", "preferred_coding_lang": user.preferred_coding_lang}

# 선호 언어 조회
@router.get("/problem-starter-code/me/preferred-language")
def get_my_preferred_language(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = db.query(User).filter(User.user_id == current_user["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"preferred_coding_lang": user.preferred_coding_lang}  # 'python' | 'java' | 'javascript'
