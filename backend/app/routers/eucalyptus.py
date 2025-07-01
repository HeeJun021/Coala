# app/routers/eucalyptus.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.eucalyptus_transaction_models import EucalyptusTransaction
from app.utils.auth import get_current_user_object
from app.schemas.eucalyptus_schema import (
    EucalyptusRewardRequest,
    EucalyptusUseRequest,
    EucalyptusResponse,
)
from app.services.user import (
    reward_user_by_action,
    use_eucalyptus_by_action,
)

router = APIRouter(
    prefix="/eucalyptus",
    tags=["Eucalyptus"]
)

# 🌿 유칼립투스 보상 획득
@router.post("/reward", response_model=EucalyptusResponse)
def reward_user(
    request: EucalyptusRewardRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_object),
):
    reward = reward_user_by_action(current_user, request.action, db)
    return EucalyptusResponse(
        current_balance=current_user.eucalyptus_balance,
        changed_amount=reward,
    )


# 🌿 유칼립투스 화폐 사용
@router.post("/use", response_model=EucalyptusResponse)
def use_user_balance(
    request: EucalyptusUseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_object),
):
    cost = use_eucalyptus_by_action(current_user, request.action, db)
    return EucalyptusResponse(
        current_balance=current_user.eucalyptus_balance,
        changed_amount=cost,
    )
