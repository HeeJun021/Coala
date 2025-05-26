from sqlalchemy.orm import Session, joinedload
from app.models.user import User
from app.schemas.user import UserUpdateSchema
from app.schemas.eucalyptus_schema import ActionType
from fastapi import HTTPException
from datetime import datetime


def get_user_by_id(db: Session, user_id: str):
    return (
        db.query(User)
        .options(joinedload(User.tier))  # ✅ UserTier 정보를 함께 로드
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

# 🌿 보상 지급 (획득)
def reward_user_by_action(user: User, action: ActionType, db: Session) -> int:
    reward_table = {
        ActionType.quiz_correct: 10,
        ActionType.coding_test_passed: 30,
        ActionType.daily_login: 5,
        ActionType.team_project_complete: 50,
    }

    reward = reward_table.get(action)
    if reward is None:
        raise HTTPException(status_code=400, detail="유효하지 않은 보상 타입입니다.")

    user.eucalyptus_balance += reward
    db.commit()
    return reward


# 🌿 화폐 사용 (차감)
def use_eucalyptus_by_action(user: User, action: ActionType, db: Session) -> int:
    cost_table = {
        ActionType.quiz_correct: 5,
        ActionType.coding_test_passed: 10,
        ActionType.daily_login: 3,
        ActionType.team_project_complete: 20,
        ActionType.change_profile_image: 30,
    }

    cost = cost_table.get(action)
    if cost is None:
        raise HTTPException(status_code=400, detail="유효하지 않은 사용 타입입니다.")

    if user.eucalyptus_balance < cost:
        raise HTTPException(status_code=400, detail="유칼립투스 잔액이 부족합니다.")

    user.eucalyptus_balance -= cost
    db.commit()
    return -cost  # 사용은 음수로 반환


def update_profile_image(user: User, image_url: str, db: Session):
    user.profile_image_url = image_url
    db.commit()
    db.refresh(user)
    return user