from sqlalchemy.orm import Session, joinedload
from app.models.user import User
from app.schemas.user import UserUpdateSchema
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
