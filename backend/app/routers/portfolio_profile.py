from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

# ✅ 네 프로젝트 스타일과 동일한 경로로 교체
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.portfolio_profile_models import UserPortfolioProfile
from app.schemas.portfolio_profile_schema import PortfolioProfileOut, PortfolioProfileUpsert

router = APIRouter(prefix="/portfolio/profile", tags=["Portfolio Profile"])

@router.get("/me", response_model=PortfolioProfileOut)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prof = db.query(UserPortfolioProfile).filter_by(user_id=current_user.user_id).first()
    if not prof:
        # 최초 사용자: 빈 값 반환
        return PortfolioProfileOut(
            user_id=current_user.user_id,
            full_name=None, birth_date=None, phone=None, email=None,
            education=[], career=[]
        )
    return prof

@router.put("", response_model=PortfolioProfileOut)
def upsert_my_profile(
    payload: PortfolioProfileUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prof = db.query(UserPortfolioProfile).filter_by(user_id=current_user.user_id).first()
    if not prof:
        prof = UserPortfolioProfile(user_id=current_user.user_id)
        db.add(prof)

    prof.full_name = payload.full_name
    prof.birth_date = payload.birth_date
    prof.phone = payload.phone
    prof.email = payload.email
    prof.education = [i.model_dump() for i in payload.education]
    prof.career = [i.model_dump() for i in payload.career]

    db.commit()
    db.refresh(prof)
    return prof
