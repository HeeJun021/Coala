from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.schemas.notification import NotificationResponse
from app.models.notification import Notification
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["Notifications"])

# ✅ 1. 알림 목록 조회 (최신순)
@router.get("", response_model=list[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifications = (
        db.query(Notification)
        .filter(Notification.receiver_id == current_user.user_id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return notifications


# ✅ 2. 알림 읽음 처리
@router.patch("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = db.query(Notification).filter(Notification.notification_id == notification_id).first()
    if not notif or notif.receiver_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다.")

    notif.is_read = True
    db.commit()
    return {"message": "알림을 읽음 처리했습니다."}


# ✅ 3. (선택) 알림 삭제
@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = db.query(Notification).filter(Notification.notification_id == notification_id).first()
    if not notif or notif.receiver_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다.")

    db.delete(notif)
    db.commit()
    return {"message": "알림이 삭제되었습니다."}
