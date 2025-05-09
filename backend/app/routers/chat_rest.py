from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel
from sqlalchemy.sql import func
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert  # upsert용
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from app.database import get_db
from app.models.chat import ChatRoom, ChatRoomParticipant, ChatMessage, ChatMessageRead
from app.models.user import UserFollow
from app.models.user import User
from app.dependencies.auth import get_current_user
from app.schemas.chat import (
    ChatRoomCreateRequest,
    ChatRoomCreateResponse,
    ChatParticipant,
    ChatRoomListItem,
    ChatMessageCreateRequest,
    ChatMessageCreateResponse,
    ChatMessageItem,
    ChatRoomInviteRequest,
    ChatRoomInviteResponse,
    ChatRoomLeaveResponse,
    ChatRoomRenameRequest,
    ChatRoomRenameResponse,
    ChatMessageReadRequest,
    ChatRoomPinToggleRequest,
    ChatRoomPinToggleResponse,
    ChatRoomArchiveToggleRequest,
    ChatRoomArchiveToggleResponse,
)
from app.schemas.user import UserSimpleInfo

from datetime import datetime


router = APIRouter(prefix="/api/chat", tags=["Chat (REST)"])


# 방 생성
@router.post("/create", response_model=ChatRoomCreateResponse)
def create_chat_room(
    data: ChatRoomCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user is None:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

    # 1. 참여자 구성 (중복 제거 + 본인 추가)
    all_participants = set(data.participant_ids)
    all_participants.add(current_user.user_id)

    # ✅ 1:1 여부 판별
    is_group = not (len(data.participant_ids) == 1)

    # ✅ 채팅방 이름 생성
    if not is_group:
        target_id = data.participant_ids[0]
        target_nickname = (
            db.query(User.nickname).filter(User.user_id == target_id).scalar()
        )
        room_name = target_nickname or "이름 없음"
    else:
        nicknames = (
            db.query(User.nickname)
            .filter(User.user_id.in_(all_participants))
            .order_by(User.nickname.asc())
            .all()
        )
        room_name = ", ".join(n for (n,) in nicknames)

    # 2. 채팅방 생성
    new_room = ChatRoom(
        room_type=data.room_type,
        is_group=is_group,
        room_name=room_name,
    )
    db.add(new_room)
    db.commit()
    db.refresh(new_room)

    # 3. 참여자 추가 + 초대 메시지용 닉네임 수집
    invited_user_ids = list(all_participants - {current_user.user_id})
    invited_user_nicknames = []

    for user_id in all_participants:
        is_archived = False

        if user_id != current_user.user_id:
            # ✅ 팔로우 여부 확인: user_id가 current_user를 팔로우했는가?
            is_following = (
                db.query(UserFollow)
                .filter_by(follower_id=user_id, following_id=current_user.user_id)
                .first()
                is not None
            )
            if not is_following:
                is_archived = True  # → 요청함으로 이동

            nickname = db.query(User.nickname).filter(User.user_id == user_id).scalar()
            invited_user_nicknames.append(nickname)

        db.add(
            ChatRoomParticipant(
                room_id=new_room.room_id,
                user_id=user_id,
                is_archived=is_archived,
                is_deleted=False,
            )
        )

    # 4. 시스템 메시지 생성
    if invited_user_nicknames:
        inviter_nickname = current_user.nickname

        if not is_group and len(invited_user_nicknames) == 1:
            # ✅ 1:1 대화 메시지
            system_text = f"{invited_user_nicknames[0]}님과의 채팅이 시작되었습니다."
        else:
            # ✅ 그룹 대화 메시지
            system_text = f"{inviter_nickname}님이 {', '.join(invited_user_nicknames)}님을 초대했습니다."

        system_msg = ChatMessage(
            room_id=new_room.room_id,
            sender_id=current_user.user_id,
            message=system_text,
            message_type="system",
        )
        db.add(system_msg)

    db.commit()

    return ChatRoomCreateResponse(room_id=new_room.room_id)


# 2. 채팅방 목록 조회 API(핀 고정 기능 포함)
@router.get("/list", response_model=List[ChatRoomListItem])
def get_chat_rooms(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    results = (
        db.query(
            ChatRoomParticipant.room_id,
            ChatRoom.room_type,
            ChatRoom.is_group,
            ChatRoom.room_name,
            ChatRoomParticipant.custom_room_name,
            ChatRoomParticipant.is_pinned,
            ChatRoomParticipant.pinned_at,  # ✅ 추가
            ChatRoomParticipant.joined_at,
            ChatRoomParticipant.last_read_message_id,
        )
        .join(ChatRoom, ChatRoomParticipant.room_id == ChatRoom.room_id)
        .filter(
            ChatRoomParticipant.user_id == current_user.user_id,
            ChatRoomParticipant.is_archived == False,
            ChatRoomParticipant.is_deleted == False,
        )
        .order_by(
            ChatRoomParticipant.is_pinned.desc(),
            ChatRoomParticipant.pinned_at.desc().nullslast(),  # ✅ pinned_at 기준 정렬
        )
        .all()
    )

    chat_room_list = []

    for row in results:
        last_msg = (
            db.query(ChatMessage)
            .filter(ChatMessage.room_id == row.room_id)
            .order_by(ChatMessage.sent_at.desc())
            .first()
        )

        unread_count = (
            db.query(ChatMessage)
            .filter(
                ChatMessage.room_id == row.room_id,
                ChatMessage.message_id > func.coalesce(row.last_read_message_id, -1),
                ChatMessage.sender_id != current_user.user_id,
                ChatMessage.message_type != "system",
            )
            .count()
        )

        display_name = row.custom_room_name if row.custom_room_name else row.room_name

        participant_rows = (
            db.query(User.user_id, User.nickname, User.profile_image_url)
            .join(ChatRoomParticipant, ChatRoomParticipant.user_id == User.user_id)
            .filter(ChatRoomParticipant.room_id == row.room_id)
            .limit(4)
            .all()
        )

        participants = [
            ChatParticipant(
                user_id=p.user_id,
                nickname=p.nickname,
                profile_url=p.profile_image_url,
            )
            for p in participant_rows
        ]

        chat_room_list.append(
            ChatRoomListItem(
                room_id=row.room_id,
                room_type=row.room_type,
                is_group=row.is_group,
                room_name=display_name,
                is_pinned=row.is_pinned,
                joined_at=row.joined_at,
                last_message=last_msg.message if last_msg else None,
                last_message_time=last_msg.sent_at if last_msg else None,
                unread_count=unread_count,
                participants=participants,
            )
        )

    # ✅ 고정되지 않은 채팅방만 후처리로 최신 메시지 정렬
    pinned = [c for c in chat_room_list if c.is_pinned]
    unpinned = sorted(
        [c for c in chat_room_list if not c.is_pinned],
        key=lambda x: x.last_message_time or datetime.min,
        reverse=True,
    )

    return pinned + unpinned


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
        file_name=data.file_name,  # ✅ 추가
        file_size=data.file_size,  # ✅ 추가
        uploaded_at=data.uploaded_at,  # ✅ 추가
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    # ✅ 3. 보낸 사람은 자동으로 읽은 것으로 처리
    stmt = (
        insert(ChatMessageRead)
        .values(message_id=new_message.message_id, user_id=current_user.user_id)
        .on_conflict_do_nothing()
    )
    db.execute(stmt)
    db.commit()

    # 4. 응답 반환
    return ChatMessageCreateResponse(
        message_id=new_message.message_id,
        room_id=new_message.room_id,
        sender_id=new_message.sender_id,
        message=new_message.message,
        message_type=new_message.message_type,
        file_url=new_message.file_url,
        file_name=new_message.file_name,  # ✅ 추가
        file_size=new_message.file_size,  # ✅ 추가
        uploaded_at=new_message.uploaded_at,  # ✅ 추가
        sent_at=new_message.sent_at,
    )


# 채팅 조회
@router.get("/{room_id}/messages", response_model=List[ChatMessageItem])
def get_messages(
    room_id: int,
    limit: int = Query(20, ge=1, le=100),
    before_message_id: Optional[int] = Query(None),  # 🔄 offset → cursor 방식
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

    # 2. 메시지 조회 쿼리 (최신순)
    query = db.query(ChatMessage).filter(ChatMessage.room_id == room_id)

    # ✅ 이전 메시지만 가져오도록 조건 추가 (cursor 방식)
    if before_message_id:
        query = query.filter(ChatMessage.message_id < before_message_id)

    messages = query.order_by(ChatMessage.sent_at.desc()).limit(limit).all()

    # 3. 읽음 처리: 가장 최신 메시지를 읽은 것으로 간주
    if messages:
        newest_message = messages[0]
        if (
            participant.last_read_message_id is None
            or newest_message.message_id > participant.last_read_message_id
        ):
            participant.last_read_message_id = newest_message.message_id
            participant.last_read_at = newest_message.sent_at
            db.commit()

    # 4. read_count 조회
    message_ids = [m.message_id for m in messages]
    read_counts_raw = (
        db.query(ChatMessageRead.message_id, func.count(ChatMessageRead.user_id))
        .filter(ChatMessageRead.message_id.in_(message_ids))
        .group_by(ChatMessageRead.message_id)
        .all()
    )
    read_count_map = {msg_id: count for msg_id, count in read_counts_raw}

    # 5. 유저 정보 캐싱
    sender_ids = {m.sender_id for m in messages}
    sender_info_map = {
        u.user_id: u for u in db.query(User).filter(User.user_id.in_(sender_ids)).all()
    }

    # 6. 응답 생성 (최신순으로 받은 후 프론트에서 .reverse() 해야 함)
    return [
        ChatMessageItem(
            message_id=msg.message_id,
            sender=UserSimpleInfo.model_validate(sender_info_map[msg.sender_id]),
            message=(
                "파일을 보냈습니다."
                if msg.message_type == "file"
                else (
                    "사진을 보냈습니다." if msg.message_type == "image" else msg.message
                )
            ),
            message_type=msg.message_type,
            file_url=msg.file_url,
            file_name=msg.file_name,
            file_size=msg.file_size,
            uploaded_at=msg.uploaded_at,
            sent_at=msg.sent_at,
            read_count=read_count_map.get(msg.message_id, 0),
        )
        for msg in messages
    ]


# 채팅방 초대(시스템 메시지도 구현 완)
@router.post("/{room_id}/invite", status_code=204)
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

    # 실제 초대 수행
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
            room_id=room_id,
            sender_id=current_user.user_id,
            message=system_text,
            message_type="system",
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
            room_id=room_id,
            sender_id=current_user.user_id,  # ✅ 나간 사용자를 sender로 지정
            message=system_text,
            message_type="system",
        )
        db.add(system_msg)
        db.commit()

    return ChatRoomLeaveResponse(room_id=room_id, room_deleted=room_deleted)


# 사용자 별 채팅 이름 바꾸기
@router.post("/{room_id}/rename", response_model=ChatRoomRenameResponse)
def rename_chat_room(
    room_id: int,
    data: ChatRoomRenameRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    participant = (
        db.query(ChatRoomParticipant)
        .filter_by(room_id=room_id, user_id=current_user.user_id)
        .first()
    )

    if not participant:
        raise HTTPException(status_code=403, detail="참여 중인 채팅방이 아닙니다.")

    participant.custom_room_name = data.new_name
    db.commit()

    return ChatRoomRenameResponse(room_id=room_id, custom_room_name=data.new_name)


# 메시지 읽음
@router.post("/{room_id}/read", status_code=204)
def mark_message_as_read(
    room_id: int,
    data: ChatMessageReadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # ✅ 참여 확인
    participant = (
        db.query(ChatRoomParticipant)
        .filter_by(room_id=room_id, user_id=current_user.user_id)
        .first()
    )

    if not participant:
        raise HTTPException(status_code=403, detail="참여 중인 채팅방이 아닙니다.")

    # ✅ 해당 room의 읽지 않은 메시지 중 last_read_message_id 이하 메시지 모두 가져오기
    messages_to_mark = (
        db.query(ChatMessage.message_id)
        .filter(
            ChatMessage.room_id == room_id,
            ChatMessage.message_id <= data.last_read_message_id,
        )
        .all()
    )

    # ✅ 중복 방지를 위해 upsert 수행 (PostgreSQL 전용)
    for (message_id,) in messages_to_mark:
        stmt = (
            insert(ChatMessageRead)
            .values(message_id=message_id, user_id=current_user.user_id)
            .on_conflict_do_nothing()
        )
        db.execute(stmt)

    # ✅ ChatRoomParticipants 기준 최신 메시지도 갱신
    if (
        participant.last_read_message_id is None
        or data.last_read_message_id > participant.last_read_message_id
    ):
        participant.last_read_message_id = data.last_read_message_id
        participant.last_read_at = func.now()

    db.commit()
    return


# 채팅창 고정
@router.patch("/{room_id}/pin", response_model=ChatRoomPinToggleResponse)
def toggle_chat_room_pin(
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
        raise HTTPException(status_code=404, detail="채팅방에 참여 중이지 않습니다.")

    # ✅ 상태 반전 및 시간 설정
    if participant.is_pinned:
        participant.is_pinned = False
        participant.pinned_at = None
    else:
        participant.is_pinned = True
        participant.pinned_at = datetime.utcnow()

    db.commit()

    return ChatRoomPinToggleResponse(room_id=room_id, is_pinned=participant.is_pinned)


# 보관함 채팅방 조회
@router.get("/archived", response_model=List[ChatRoomListItem])
def get_archived_chat_rooms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    results = (
        db.query(
            ChatRoomParticipant.room_id,
            ChatRoom.room_type,
            ChatRoom.is_group,
            ChatRoom.room_name,
            ChatRoomParticipant.custom_room_name,
            ChatRoomParticipant.joined_at,
            ChatRoomParticipant.last_read_message_id,
        )
        .join(ChatRoom, ChatRoomParticipant.room_id == ChatRoom.room_id)
        .filter(
            ChatRoomParticipant.user_id == current_user.user_id,
            ChatRoomParticipant.is_archived == True,  # ✅ 보관된 방만
            ChatRoomParticipant.is_deleted == False,  # ✅ 추가
        )
        .order_by(ChatRoomParticipant.joined_at.desc())  # ✅ pinned 정렬 제거
        .all()
    )

    chat_room_list = []

    for row in results:
        last_msg = (
            db.query(ChatMessage)
            .filter(ChatMessage.room_id == row.room_id)
            .order_by(ChatMessage.sent_at.desc())
            .first()
        )

        unread_count = (
            db.query(ChatMessage)
            .filter(
                ChatMessage.room_id == row.room_id,
                ChatMessage.message_id > func.coalesce(row.last_read_message_id, -1),
                ChatMessage.sender_id != current_user.user_id,
                ChatMessage.message_type != "system",
            )
            .count()
        )

        display_name = row.custom_room_name if row.custom_room_name else row.room_name

        participant_rows = (
            db.query(User.user_id, User.nickname, User.profile_image_url)
            .join(ChatRoomParticipant, ChatRoomParticipant.user_id == User.user_id)
            .filter(ChatRoomParticipant.room_id == row.room_id)
            .limit(4)
            .all()
        )

        participants = [
            ChatParticipant(
                user_id=p.user_id,
                nickname=p.nickname,
                profile_url=p.profile_image_url,
            )
            for p in participant_rows
        ]

        chat_room_list.append(
            ChatRoomListItem(
                room_id=row.room_id,
                room_type=row.room_type,
                is_group=row.is_group,
                room_name=display_name,
                is_pinned=False,  # ✅ 보관함엔 핀 X
                joined_at=row.joined_at,
                last_message=last_msg.message if last_msg else None,
                last_message_time=last_msg.sent_at if last_msg else None,
                unread_count=unread_count,
                participants=participants,
            )
        )

    return chat_room_list


# 채팅방 보관함 이동(수락)
@router.patch("/{room_id}/accept", response_model=ChatRoomArchiveToggleResponse)
def accept_chat_request(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    채팅 요청 수락 → is_archived=False 로 변경 (복원)
    """
    participant = (
        db.query(ChatRoomParticipant)
        .filter_by(room_id=room_id, user_id=current_user.user_id)
        .first()
    )

    if not participant:
        raise HTTPException(status_code=404, detail="채팅방에 참여 중이지 않습니다.")

    if participant.is_deleted:
        raise HTTPException(status_code=400, detail="이미 거절된 채팅방입니다.")

    if participant.is_archived is False:
        raise HTTPException(status_code=400, detail="이미 수락된 채팅방입니다.")

    participant.is_archived = False
    db.commit()

    return ChatRoomArchiveToggleResponse(room_id=room_id, is_archived=False)


# 채팅방 보관함 이동(거절)
@router.patch("/{room_id}/reject", response_model=ChatRoomArchiveToggleResponse)
def reject_chat_request(
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
        raise HTTPException(status_code=404, detail="채팅방에 참여 중이지 않습니다.")

    if participant.is_deleted:
        raise HTTPException(status_code=400, detail="이미 거절된 요청입니다.")

    participant.is_deleted = True  # ✅ 요청함에서 숨김 처리
    db.commit()

    return ChatRoomArchiveToggleResponse(
        room_id=room_id, is_archived=True  # 여전히 보관된 상태
    )


# 채팅방 참여자 조회
@router.get("/{room_id}/participants", response_model=List[UserSimpleInfo])
def get_chat_participants(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # ✅ 현재 유저가 이 방에 참여 중인지 확인
    is_participant = (
        db.query(ChatRoomParticipant)
        .filter_by(room_id=room_id, user_id=current_user.user_id)
        .first()
    )

    if not is_participant:
        raise HTTPException(
            status_code=403, detail="채팅방에 참여 중인 사용자만 조회할 수 있습니다."
        )

    # ✅ 채팅방 참여자 정보 조회
    users = (
        db.query(User)
        .join(ChatRoomParticipant, User.user_id == ChatRoomParticipant.user_id)
        .filter(ChatRoomParticipant.room_id == room_id)
        .all()
    )

    return users
