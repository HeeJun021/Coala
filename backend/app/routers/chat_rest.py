from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.chat import ChatRoom, ChatRoomParticipant, ChatMessage
from app.models.user import User
from app.dependencies.auth import get_current_user
from app.schemas.chat import (
    ChatRoomCreateRequest,
    ChatRoomCreateResponse,
    ChatRoomListItem,
    ChatMessageCreateRequest,
    ChatMessageCreateResponse,
    ChatMessageItem,
    ChatRoomInviteRequest,
    ChatRoomInviteResponse,
    ChatRoomLeaveResponse,
)

router = APIRouter(prefix="/api/chat", tags=["Chat (REST)"])


@router.post("/create", response_model=ChatRoomCreateResponse)
def create_chat_room(
    data: ChatRoomCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user is None:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

    # 1. 참여자 목록 구성 (자기 자신 + 초대한 사람들)
    all_participants = set(data.participant_ids)
    all_participants.add(current_user.user_id)

    # 2. 닉네임 정렬하여 room_name 구성
    nicknames = (
        db.query(User.nickname)
        .filter(User.user_id.in_(all_participants))
        .order_by(User.nickname.asc())
        .all()
    )
    room_name = ", ".join(n for (n,) in nicknames)

    # 3. 채팅방 생성
    new_room = ChatRoom(
        room_type=data.room_type,
        is_group=data.is_group,
        room_name=room_name,  # ✅ 자동 생성된 room_name 지정
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
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    # 기본 채팅방 정보 + 참여 정보
    results = (
        db.query(
            ChatRoomParticipant.room_id,
            ChatRoom.room_type,
            ChatRoom.is_group,
            ChatRoom.room_name,
            ChatRoomParticipant.is_pinned,
            ChatRoomParticipant.joined_at,
            ChatRoomParticipant.last_read_message_id,
        )
        .join(ChatRoom, ChatRoomParticipant.room_id == ChatRoom.room_id)
        .filter(ChatRoomParticipant.user_id == current_user.user_id)
        .order_by(
            ChatRoomParticipant.is_pinned.desc(), ChatRoomParticipant.joined_at.desc()
        )
        .all()
    )

    chat_room_list = []

    for row in results:
        # 🔸 최근 메시지 조회
        last_msg = (
            db.query(ChatMessage)
            .filter(ChatMessage.room_id == row.room_id)
            .order_by(ChatMessage.sent_at.desc())
            .first()
        )

        # 🔸 읽지 않은 메시지 수
        unread_count = 0
        if row.last_read_message_id is not None:
            unread_count = (
                db.query(ChatMessage)
                .filter(
                    ChatMessage.room_id == row.room_id,
                    ChatMessage.message_id > row.last_read_message_id,
                )
                .count()
            )

        chat_room_list.append(
            ChatRoomListItem(
                room_id=row.room_id,
                room_type=row.room_type,
                is_group=row.is_group,
                room_name=row.room_name,
                is_pinned=row.is_pinned,
                joined_at=row.joined_at,
                last_message=last_msg.message if last_msg else None,
                last_message_time=last_msg.sent_at if last_msg else None,
                unread_count=unread_count,
            )
        )

    return chat_room_list


# 메시지 보내기
@router.post("/{room_id}/send", response_model=ChatMessageCreateResponse)
def send_message(
    room_id: int,
    data: ChatMessageCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. 채팅방 참여자인지 확인
    participant = (
        db.query(ChatRoomParticipant)
        .filter_by(room_id=room_id, user_id=current_user.user_id)
        .first()
    )

    if not participant:
        raise HTTPException(status_code=403, detail="채팅방 참여자가 아닙니다.")

    # 2. 메시지 생성
    new_message = ChatMessage(
        room_id=room_id,
        sender_id=current_user.user_id,
        message=data.message,
        message_type=data.message_type,
        file_url=data.file_url,
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    return ChatMessageCreateResponse(
        message_id=new_message.message_id,
        room_id=new_message.room_id,
        sender_id=new_message.sender_id,
        message=new_message.message,
        message_type=new_message.message_type,
        file_url=new_message.file_url,
        sent_at=new_message.sent_at,
    )


# 채팅방 메시지 조회(읽기 기능 포함)
@router.get("/{room_id}/messages", response_model=List[ChatMessageItem])
def get_messages(
    room_id: int,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. 채팅방 참여자인지 확인
    participant = (
        db.query(ChatRoomParticipant)
        .filter_by(room_id=room_id, user_id=current_user.user_id)
        .first()
    )

    if not participant:
        raise HTTPException(status_code=403, detail="채팅방 참여자가 아닙니다.")

    # 2. 메시지 조회
    messages = (
        db.query(ChatMessage)
        .filter_by(room_id=room_id)
        .order_by(ChatMessage.sent_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    # ✅ 3. 마지막 메시지 기준으로 읽음 처리 업데이트
    if messages:
        newest_message = messages[0]
        # 이미 읽은 메시지보다 최신이라면 갱신
        if (
            participant.last_read_message_id is None
            or newest_message.message_id > participant.last_read_message_id
        ):
            participant.last_read_message_id = newest_message.message_id
            participant.last_read_at = newest_message.sent_at
            db.commit()

    # 4. 응답 반환
    return [
        ChatMessageItem(
            message_id=msg.message_id,
            sender_id=msg.sender_id,
            message=msg.message,
            message_type=msg.message_type,
            file_url=msg.file_url,
            sent_at=msg.sent_at,
        )
        for msg in messages
    ]


# 채팅방 초대(시스템 메시지도 구현 완)
@router.post("/{room_id}/invite", response_model=ChatRoomInviteResponse)
def invite_users_to_chat_room(
    room_id: int,
    data: ChatRoomInviteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_participant = (
        db.query(ChatRoomParticipant)
        .filter_by(room_id=room_id, user_id=current_user.user_id)
        .first()
    )
    if not current_participant:
        raise HTTPException(status_code=403, detail="참여 중인 채팅방이 아닙니다.")

    # 중복 제거
    existing_user_ids = (
        db.query(ChatRoomParticipant.user_id).filter_by(room_id=room_id).all()
    )
    existing_user_ids = set(user_id for (user_id,) in existing_user_ids)
    new_user_ids = [uid for uid in data.user_ids if uid not in existing_user_ids]

    for uid in new_user_ids:
        db.add(ChatRoomParticipant(room_id=room_id, user_id=uid))
    db.commit()

    # 초대된 유저 닉네임 조회
    invited_users = (
        db.query(User.user_id, User.nickname)
        .filter(User.user_id.in_(new_user_ids))
        .all()
    )
    invited_user_nicknames = [user.nickname for user in invited_users]

    # 시스템 메시지 생성
    inviter_nick = current_user.nickname
    if invited_user_nicknames:
        system_text = (
            f"{inviter_nick}님이 {', '.join(invited_user_nicknames)}님을 초대했습니다."
        )
        system_msg = ChatMessage(
            room_id=room_id, sender_id=None, message=system_text, message_type="system"
        )
        db.add(system_msg)
        db.commit()

    return ChatRoomInviteResponse(
        room_id=room_id,
        invited_user_ids=new_user_ids,
        invited_user_nicknames=invited_user_nicknames,
    )


# 채팅방 나가기(시스템 메시지도 구현 완)
@router.delete("/{room_id}/leave", response_model=ChatRoomLeaveResponse)
def leave_chat_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    participant = (
        db.query(ChatRoomParticipant)
        .filter_by(room_id=room_id, user_id=current_user.user_id)
        .first()
    )
    if not participant:
        raise HTTPException(status_code=404, detail="참여 중인 채팅방이 아닙니다.")

    db.delete(participant)
    db.commit()

    # 나간 후 남은 인원 확인
    remaining = db.query(ChatRoomParticipant).filter_by(room_id=room_id).count()
    room_deleted = False

    if remaining == 0:
        # 마지막 1인이 나간 경우 → 방 자체 삭제
        db.query(ChatRoom).filter_by(room_id=room_id).delete()
        db.commit()
        room_deleted = True
    else:
        # 아직 남은 사람이 있다면 시스템 메시지 작성
        leaver_nick = current_user.nickname
        system_text = f"{leaver_nick}님이 나갔습니다."
        system_msg = ChatMessage(
            room_id=room_id, sender_id=None, message=system_text, message_type="system"
        )
        db.add(system_msg)
        db.commit()

    return ChatRoomLeaveResponse(room_id=room_id, room_deleted=room_deleted)
