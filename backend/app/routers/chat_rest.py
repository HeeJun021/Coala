from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.chat import ChatRoom, ChatRoomParticipant, ChatMessage
from app.models.user import User
from app.dependencies.auth import get_current_user
from app.schemas.chat import ChatRoomCreateRequest, ChatRoomCreateResponse, ChatRoomListItem

router = APIRouter(prefix="/api/chat", tags=["Chat (REST)"])

@router.post("/create", response_model=ChatRoomCreateResponse)
def create_chat_room(
    data: ChatRoomCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user is None:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

    # 1. 참여자 목록 구성 (자기 자신 + 초대한 사람들)
    all_participants = set(data.participant_ids)
    all_participants.add(current_user.user_id)

    # 2. 닉네임 정렬하여 room_name 구성
    nicknames = db.query(User.nickname).filter(User.user_id.in_(all_participants)).order_by(User.nickname.asc()).all()
    room_name = ", ".join(n for (n,) in nicknames)

    # 3. 채팅방 생성
    new_room = ChatRoom(
        room_type=data.room_type,
        is_group=data.is_group,
        room_name=room_name  # ✅ 자동 생성된 room_name 지정
    )
    db.add(new_room)
    db.commit()
    db.refresh(new_room)

    # 4. 참여자 추가
    for user_id in all_participants:
        participant = ChatRoomParticipant(room_id=new_room.room_id, user_id=user_id)
        db.add(participant)

    db.commit()
    return ChatRoomCreateResponse(room_id=new_room.room_id)


# 2. 채팅방 목록 조회 API
@router.get("/list", response_model=List[ChatRoomListItem])
def get_chat_rooms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 기본 채팅방 정보 + 참여 정보
    results = db.query(
        ChatRoomParticipant.room_id,
        ChatRoom.room_type,
        ChatRoom.is_group,
        ChatRoom.room_name,
        ChatRoomParticipant.is_pinned,
        ChatRoomParticipant.joined_at,
        ChatRoomParticipant.last_read_message_id
    ).join(
        ChatRoom, ChatRoomParticipant.room_id == ChatRoom.room_id
    ).filter(
        ChatRoomParticipant.user_id == current_user.user_id
    ).order_by(
        ChatRoomParticipant.is_pinned.desc(),
        ChatRoomParticipant.joined_at.desc()
    ).all()

    chat_room_list = []

    for row in results:
        # 🔸 최근 메시지 조회
        last_msg = db.query(ChatMessage).filter(
            ChatMessage.room_id == row.room_id
        ).order_by(ChatMessage.sent_at.desc()).first()

        # 🔸 읽지 않은 메시지 수
        unread_count = 0
        if row.last_read_message_id is not None:
            unread_count = db.query(ChatMessage).filter(
                ChatMessage.room_id == row.room_id,
                ChatMessage.message_id > row.last_read_message_id
            ).count()

        chat_room_list.append(ChatRoomListItem(
            room_id=row.room_id,
            room_type=row.room_type,
            is_group=row.is_group,
            room_name=row.room_name,
            is_pinned=row.is_pinned,
            joined_at=row.joined_at,
            last_message=last_msg.message if last_msg else None,
            last_message_time=last_msg.sent_at if last_msg else None,
            unread_count=unread_count
        ))

    return chat_room_list