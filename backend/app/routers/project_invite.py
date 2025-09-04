from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.services.invite_service import send_project_invite, accept_project_invite
from app.services.project_git.github_service import invite_collaborator
from app.models.user import User

router = APIRouter(prefix="/projects", tags=["ProjectInvites"])


# 1. 프로젝트 초대 전송
@router.post("/{project_id}/invite")
def invite_user_to_project(
    project_id: int,
    payload: dict,  # { "receiver_id": 123 }
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    receiver_id = payload.get("receiver_id")
    if not receiver_id:
        raise HTTPException(status_code=400, detail="receiver_id is required")

    send_project_invite(
        db=db, sender=current_user, receiver_id=receiver_id, project_id=project_id
    )

    return {"message": "초대 요청이 전송되었습니다."}


# 2. 프로젝트 초대 수락
@router.post("/{project_id}/accept")
def accept_project_invitation(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1) 내부 프로젝트 멤버십 수락 처리
    accept_project_invite(db=db, user=current_user, project_id=project_id)

    # 2) GitHub collaborator 초대 (권한은 push 기본)
    #    actor_user_id로 현재 사용자 전달(소유자 토큰 없을 때 fallback 용)
    invite_collaborator(db=db, project_id=project_id, invitee_user_id=current_user.user_id, permission="push", actor_user_id=current_user.user_id)

    return {"message": "프로젝트에 참여하고 레포 Collaborator 초대가 전송되었습니다."}


# 3. 프로젝트 초대 거절
@router.post("/{project_id}/reject")
def reject_project_invitation(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 요청방 찾기 (초대방, 1:1)
    from app.models.chat_models import ChatRoom, ChatRoomParticipant

    invite_room = (
        db.query(ChatRoom)
        .join(ChatRoomParticipant, ChatRoom.room_id == ChatRoomParticipant.room_id)
        .filter(
            ChatRoom.project_id == None,
            ChatRoom.room_type == "invite",
            ChatRoom.is_group == False,
            ChatRoomParticipant.user_id == current_user.user_id,
        )
        .order_by(ChatRoom.created_at.desc())
        .first()
    )

    if not invite_room:
        raise HTTPException(
            status_code=404, detail="초대 요청 채팅방을 찾을 수 없습니다."
        )

    # 본인 기준으로 soft-delete 처리
    participant = (
        db.query(ChatRoomParticipant)
        .filter_by(room_id=invite_room.room_id, user_id=current_user.user_id)
        .first()
    )

    if participant:
        participant.is_deleted = True
        db.commit()

    return {"message": "초대 요청이 거절되었습니다."}
