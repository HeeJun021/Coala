from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Optional
from app.models.user import User
from app.models.eucalyptus_transaction_models import EucalyptusTransaction
from app.schemas.user import UserUpdateSchema
from app.schemas.eucalyptus_schema import RewardActionType, UseActionType
from fastapi import HTTPException
from datetime import datetime
from enum import Enum  # 꼭 추가되어 있어야 함

def get_user_by_id(db: Session, user_id: str):
    return (
        db.query(User)
        .options(joinedload(User.tier))  # UserTier 정보를 함께 로드
        .filter(User.user_id == user_id)
        .first()
    )

# 사용자 정보 업데이트
def update_user_info(db: Session, user_id: int, user_update: UserUpdateSchema):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.nickname = user_update.nickname
    user.bio = user_update.bio
    user.profile_image_url = user_update.profile_image_url
    user.updated_at = datetime.now()
    
    db.commit()
    db.refresh(user)
    return user

def reward_user_by_action(
    user: User,
    action: RewardActionType,
    db: Session,
    amount: Optional[int] = None  # 선택적으로 외부에서 주입 가능
) -> int:
    reward_table = {
        RewardActionType.quiz_correct: 10,
        RewardActionType.coding_test_passed: 30,
        RewardActionType.daily_attendance: 5,
        RewardActionType.team_project_complete: 50,
    }

    reward = amount if amount is not None else reward_table.get(action)
    if reward is None:
        raise HTTPException(status_code=400, detail="유효하지 않은 보상 타입입니다.")

    # 하루 누적 획득량 계산
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_total = db.query(func.sum(EucalyptusTransaction.amount)).filter(
        EucalyptusTransaction.user_id == user.user_id,
        EucalyptusTransaction.amount > 0,
        EucalyptusTransaction.created_at >= today_start
    ).scalar() or 0

    if today_total + reward > 300:
        raise HTTPException(status_code=400, detail="오늘은 최대 300 유칼립투스까지만 획득할 수 있습니다.")

    # 유칼립투스 지급
    user.eucalyptus_balance += reward

    db.add(EucalyptusTransaction(
        user_id=user.user_id,
        amount=reward,
        action=action.value,
        created_at=datetime.now()
    ))

    db.commit()
    return reward


# 화폐 사용 (차감)
def use_eucalyptus_by_action(user: User, action: UseActionType, db: Session) -> int:
    cost_table = {
        UseActionType.change_profile_image: 30,
    }

    cost = cost_table.get(action)
    if cost is None:
        raise HTTPException(status_code=400, detail="유효하지 않은 사용 타입입니다.")

    if user.eucalyptus_balance < cost:
        raise HTTPException(status_code=400, detail="유칼립투스 잔액이 부족합니다.")

    user.eucalyptus_balance -= cost

    # enum이든 str이든 안전하게 처리
    action_str = action.value if isinstance(action, Enum) else str(action)

    db.add(EucalyptusTransaction(
        user_id=user.user_id,
        amount=-cost,
        action=action_str,
        created_at=datetime.now()
    ))

    db.commit()
    return -cost


def update_profile_image(user: User, image_url: str, db: Session):
    user.profile_image_url = image_url
    db.commit()
    db.refresh(user)
    return user