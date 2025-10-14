# backend/app/services/eucalyptus_service.py
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.user import User  

REQUIRED_LEAVES_PUBLISH = 100

def assert_can_publish(user: User) -> None:
    """퍼블리시 전 잔액 검사 (부족 시 403)"""
    # 🔹 user.eucalyptus_leaves -> user.eucalyptus_balance 로 수정
    if user.eucalyptus_balance < REQUIRED_LEAVES_PUBLISH:
        raise HTTPException(
            status_code=403,
            # 🔹 여기도 함께 수정하면 에러 메시지가 더 정확해집니다.
            detail=f"유칼립투스 잎이 부족합니다. (필요: {REQUIRED_LEAVES_PUBLISH}, 보유: {user.eucalyptus_balance})"
        )

def deduct_for_publish(user: User) -> None:
    """퍼블리시 성공 후 100 잎 차감 (commit은 호출자에서)"""
    # 🔹 user.eucalyptus_leaves -> user.eucalyptus_balance 로 수정
    user.eucalyptus_balance -= REQUIRED_LEAVES_PUBLISH