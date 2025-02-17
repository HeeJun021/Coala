from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserUpdateSchema
from fastapi import HTTPException

def get_user_by_id(db: Session, user_id: str):
    return db.query(User).filter(User.user_id == user_id).first()

# 사용자 정보 업데이트 (닉네임, 자기소개, 개발 직군)
def update_user_info(db: Session, user_id: str, user_update: UserUpdateSchema):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.username = user_update.username
    user.bio = user_update.bio
    user.role = user_update.role
    user.updated_at = datetime.now()
    
    db.commit()
    db.refresh(user)
    return user
