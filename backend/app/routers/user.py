import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdateSchema, ProfileImageUpdateRequest
from app.services.user import get_user_by_id, update_user_info, update_profile_image
from app.routers.eucalyptus import use_eucalyptus_by_action
from app.utils.auth import get_current_user_object
from app.utils.security import hash_password
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = get_user_by_id(db, current_user.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}")
def update_user(user_id: int, user_update: UserUpdateSchema, db: Session = Depends(get_db)):
    updated_user = update_user_info(db, user_id, user_update)
    return updated_user

@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if not existing_user:
        raise HTTPException(status_code=400, detail="이메일 인증이 필요합니다.")
    if existing_user.email_verified is False:
        raise HTTPException(status_code=400, detail="이메일 인증이 완료되지 않았습니다.")
    existing_user.password = hash_password(user_data.password)
    existing_user.nickname = user_data.nickname
    existing_user.birth_date = user_data.birth_date
    existing_user.email_verified = True
    db.commit()
    db.refresh(existing_user)
    return existing_user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    db.delete(user)
    db.commit()

    return {"message": "계정이 성공적으로 삭제되었습니다."}

@router.patch("/profile-image")
def change_profile_image(
    req: ProfileImageUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_object),
):
    # ✅ 화폐 사용 처리
    use_eucalyptus_by_action(current_user, req.action, db)

    # ✅ 이미지 변경 처리
    updated_user = update_profile_image(current_user, req.image_url, db)

    return {
        "message": "프로필 이미지가 변경되었습니다.",
        "profile_image_url": updated_user.profile_image_url
    }
