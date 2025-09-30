# backend/app/services/eucalyptus_service.py
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.eucalyptus_transaction_models import EucalyptusTransaction

REQUIRED_LEAVES_PUBLISH = 100

def get_balance(db: Session, user_id: int) -> int:
    """유저의 현재 잎 잔액(트랜잭션 합계)"""
    bal = db.query(
        func.coalesce(func.sum(EucalyptusTransaction.amount), 0)
    ).filter(
        EucalyptusTransaction.user_id == user_id
    ).scalar()
    return int(bal or 0)

def assert_can_publish(db: Session, user_id: int) -> None:
    """퍼블리시 전 잔액 검사 (부족 시 403)"""
    bal = get_balance(db, user_id)
    if bal < REQUIRED_LEAVES_PUBLISH:
        raise HTTPException(
            status_code=403,
            detail=f"유칼립투스 잎이 부족합니다. (필요: {REQUIRED_LEAVES_PUBLISH}, 보유: {bal})"
        )

def deduct_for_publish(db: Session, user_id: int) -> None:
    """퍼블리시 성공 후 100 잎 차감 트랜잭션 기록 (commit은 호출자에서)"""
    tx = EucalyptusTransaction(
        user_id=user_id,
        amount=-REQUIRED_LEAVES_PUBLISH,
        action="publish",
    )
    db.add(tx)
    # db.flush()  # 필요시 활성화 (PK 미리 확보)
