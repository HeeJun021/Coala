from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional

from app.services.connection_manager import ConnectionManager
from app.database import get_db
from app.models.chat import ChatMessage, ChatMessageRead
from app.dependencies.auth import get_user_from_token

router = APIRouter()
manager = ConnectionManager()


@router.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):
    # ✅ 쿼리 파라미터 추출
    token: Optional[str] = websocket.query_params.get("token")
    room_id: Optional[str] = websocket.query_params.get("room_id")

    if token is None or room_id is None:
        await websocket.close(code=1008)
        return
    room_id = int(room_id)

    # 🔐 사용자 인증
    user = get_user_from_token(token, db)
    if not user:
        await websocket.close(code=1008)
        return

    user_id = user.user_id
    await manager.connect(user_id, websocket)

    # ✅ 입장 시스템 메시지 저장
    system_message = ChatMessage(
        room_id=room_id,
        sender_id=user.user_id,  # ✅ 진짜 유저 ID 사용
        message=f"{user.nickname}님이 입장하셨습니다.",
        message_type="system",
    )
    db.add(system_message)
    db.commit()
    db.refresh(system_message)

    # ✅ 입장 시스템 메시지 브로드캐스트
    participants = db.execute(
        text("SELECT user_id FROM chatroomparticipants WHERE room_id = :room_id"),
        {"room_id": room_id},
    ).fetchall()
    user_ids = [row[0] for row in participants]

    entry_response = {
        "room_id": room_id,
        "sender_id": None,
        "message": system_message.message,
        "message_type": "system",
        "sent_at": system_message.sent_at.isoformat(),
    }
    await manager.broadcast_to_room(user_ids, entry_response)

    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("type", "message")

            if event_type == "fetch_old_messages":
                before = data.get("before")  # ISO 형식 타임스탬프 문자열
                limit = data.get("limit", 20)

                # 필수값 확인
                if not before:
                    await websocket.send_json(
                        {"error": "before 타임스탬프는 필수입니다."}
                    )
                    continue

                # 이전 메시지 조회
                messages = (
                    db.query(ChatMessage)
                    .filter(
                        ChatMessage.room_id == room_id, ChatMessage.sent_at < before
                    )
                    .order_by(ChatMessage.sent_at.desc())
                    .limit(limit)
                    .all()
                )

                # 최신순으로 불러온 후 프론트 정렬 편의 위해 역순 정렬
                messages.reverse()

                # 메시지 목록 응답
                await websocket.send_json(
                    {
                        "type": "old_messages",
                        "messages": [
                            {
                                "message_id": msg.message_id,
                                "room_id": msg.room_id,
                                "sender_id": msg.sender_id,
                                "message": msg.message,
                                "message_type": msg.message_type,
                                "sent_at": msg.sent_at.isoformat(),
                            }
                            for msg in messages
                        ],
                    }
                )
                continue

            if event_type == "online_users":
                # 1. 참여자 조회
                participants = db.execute(
                    text(
                        "SELECT user_id FROM chatroomparticipants WHERE room_id = :room_id"
                    ),
                    {"room_id": room_id},
                ).fetchall()
                user_ids = [row[0] for row in participants]

                # 2. 접속 중인 유저만 필터링
                online_user_ids = [
                    uid for uid in user_ids if uid in manager.active_connections
                ]

                # 3. 응답 전송
                await websocket.send_json(
                    {"type": "online_users", "user_ids": online_user_ids}
                )
                continue

            # ✅ 읽음 처리
            if event_type == "read":
                message_id = data.get("message_id")
                if not message_id:
                    await websocket.send_json({"error": "message_id는 필수입니다."})
                    continue

                # 읽음 기록이 없다면 추가
                existing = (
                    db.query(ChatMessageRead)
                    .filter_by(message_id=message_id, user_id=user_id)
                    .first()
                )

                if not existing:
                    db.add(ChatMessageRead(message_id=message_id, user_id=user_id))
                    db.commit()

                    # ✅ 읽음 알림 브로드캐스트
                    participants = db.execute(
                        text(
                            "SELECT user_id FROM chatroomparticipants WHERE room_id = :room_id"
                        ),
                        {"room_id": room_id},
                    ).fetchall()
                    user_ids = [row[0] for row in participants]

                    response = {
                        "type": "read",
                        "message_id": message_id,
                        "user_id": user_id,
                    }
                    await manager.broadcast_to_room(user_ids, response)
                continue

            # ✅ 일반 메시지 처리
            if event_type == "message":
                message = data.get("message")
                message_type = data.get("message_type", "text")
                file_url = data.get("file_url")  # 있을 수도, 없을 수도 있음

                if not message:
                    await websocket.send_json({"error": "message는 필수입니다."})
                    continue

                # 메시지 저장
                chat_message = ChatMessage(
                    room_id=room_id,
                    sender_id=user_id,
                    message=message,
                    message_type=message_type,
                    file_url=file_url,  # ← 이 부분이 핵심
                )
                db.add(chat_message)
                db.commit()
                db.refresh(chat_message)

                # 참여자 조회
                participants = db.execute(
                    text(
                        "SELECT user_id FROM chatroomparticipants WHERE room_id = :room_id"
                    ),
                    {"room_id": room_id},
                ).fetchall()
                user_ids = [row[0] for row in participants]

                # 읽음 초기화
                for uid in user_ids:
                    if uid != user_id:
                        db.add(
                            ChatMessageRead(
                                message_id=chat_message.message_id, user_id=uid
                            )
                        )
                db.commit()

                # 메시지 전송
                response = {
                    "room_id": room_id,
                    "sender_id": user_id,
                    "message": message,
                    "message_type": message_type,
                    "file_url": file_url,
                    "sent_at": chat_message.sent_at.isoformat(),
                }
                await manager.broadcast_to_room(user_ids, response)

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)

        # ✅ 1. 퇴장 시스템 메시지 저장
        leave_message = ChatMessage(
            room_id=room_id,
            sender_id=user_id,
            message=f"{user.nickname}님이 나갔습니다.",
            message_type="system",
        )
        db.add(leave_message)
        db.commit()
        db.refresh(leave_message)

        # ✅ 2. 남아 있는 참여자 조회
        participants = db.execute(
            text("SELECT user_id FROM chatroomparticipants WHERE room_id = :room_id"),
            {"room_id": room_id},
        ).fetchall()
        user_ids = [row[0] for row in participants]

        # ✅ 3. 퇴장 메시지 브로드캐스트
        leave_response = {
            "room_id": room_id,
            "sender_id": None,
            "message": leave_message.message,
            "message_type": "system",
            "sent_at": leave_message.sent_at.isoformat(),
        }
        await manager.broadcast_to_room(user_ids, leave_response)
