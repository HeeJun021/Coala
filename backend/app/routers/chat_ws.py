from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional

from app.services.connection_manager import ConnectionManager
from app.database import get_db
from app.models.chat import ChatMessage, ChatMessageRead
from app.dependencies.auth import get_user_from_token

from starlette.datastructures import Headers
from http.cookies import SimpleCookie

router = APIRouter()
manager = ConnectionManager()


@router.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):
    # ✅ room_id 쿼리 추출
    room_id = websocket.query_params.get("room_id")
    room_id = int(room_id) if room_id else None

    # ✅ access_token은 쿠키에서 추출
    headers = Headers(scope=websocket.scope)
    cookie_header = headers.get("cookie")

    token: Optional[str] = None
    if cookie_header:
        cookies = SimpleCookie()
        cookies.load(cookie_header)
        if "access_token" in cookies:
            token = cookies["access_token"].value

    # ✅ 둘 중 하나라도 없으면 종료
    if token is None:
        await websocket.close(code=1008)
        return

    user = get_user_from_token(token, db)
    if not user:
        await websocket.close(code=1008)
        return

    user_id = user.user_id
    await manager.connect(user_id, websocket)

    # ✅ 여기 아래에 구분 로그 추가
    if room_id:
        print(f"💬 [채팅방 WS] user_id={user_id}, room_id={room_id} 연결됨")
    else:
        print(f"💬 [채팅리스트 WS] user_id={user_id} 연결됨")

    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("type", "message")

            # ✅ 과거 메시지 불러오기
            if event_type == "fetch_old_messages":
                before = data.get("before")
                limit = data.get("limit", 20)

                if not before:
                    await websocket.send_json(
                        {"error": "before 타임스탬프는 필수입니다."}
                    )
                    continue

                messages = (
                    db.query(ChatMessage)
                    .filter(
                        ChatMessage.room_id == room_id, ChatMessage.sent_at < before
                    )
                    .order_by(ChatMessage.sent_at.desc())
                    .limit(limit)
                    .all()
                )
                messages.reverse()

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
                                "file_url": msg.file_url,
                                "sent_at": msg.sent_at.isoformat(),
                            }
                            for msg in messages
                        ],
                    }
                )
                continue

            # ✅ 읽음 처리
            if event_type == "read":
                message_id = data.get("message_id")
                print(
                    f"📥 읽음 메시지 수신: user_id={user_id}, message_id={message_id}"
                )  # ✅ 로그 찍기
                if not message_id:
                    await websocket.send_json({"error": "message_id는 필수입니다."})
                    continue

                existing = (
                    db.query(ChatMessageRead)
                    .filter_by(message_id=message_id, user_id=user_id)
                    .first()
                )

                if not existing:
                    db.add(ChatMessageRead(message_id=message_id, user_id=user_id))
                    db.commit()

                    participants = db.execute(
                        text(
                            "SELECT user_id FROM chatroomparticipants WHERE room_id = :room_id"
                        ),
                        {"room_id": room_id},
                    ).fetchall()
                    user_ids = [row[0] for row in participants]
                    total_participants = len(user_ids)  # ✅ 총 참여자 수 계산

                    print(f"📤 읽음 브로드캐스트 대상: {user_ids}")

                    # ✅ 읽은 유저 ID 조회
                    read_user_ids = db.execute(
                        text(
                            "SELECT user_id FROM chatmessagereads WHERE message_id = :message_id"
                        ),
                        {"message_id": message_id},
                    ).fetchall()
                    read_user_ids_list = list(set(row[0] for row in read_user_ids))

                    # ✅ 읽지 않은 사람 수 계산
                    unread_count = total_participants - len(read_user_ids_list)

                    # ✅ WebSocket 브로드캐스트
                    await manager.broadcast_all(
                        {
                            "type": "read",
                            "room_id": room_id,
                            "message_id": message_id,
                            "unread_count": unread_count,
                        }
                    )

                continue

            # ✅ 메시지 전송
            if event_type == "message":
                message = data.get("message")
                message_type = data.get("message_type", "text")
                file_url = data.get("file_url")
                 # ✅ 메시지 메타데이터 처리
                message_metadata = None
                if message_type == "project_invite":
                    message_metadata = {
                        "project_id": data.get("project_id"),
                        "project_title": data.get("project_title"),
                        "inviter_id": user_id,
                    }

                if not message:
                    await websocket.send_json({"error": "message는 필수입니다."})
                    continue

                chat_message = ChatMessage(
                    room_id=room_id,
                    sender_id=user_id,
                    message=message,
                    message_type=message_type,
                    file_url=file_url,
                )
                db.add(chat_message)
                db.commit()
                db.refresh(chat_message)

                db.add(
                    ChatMessageRead(message_id=chat_message.message_id, user_id=user_id)
                )
                db.commit()

                # ✅ 참여자 조회
                participants = db.execute(
                    text(
                        "SELECT user_id FROM chatroomparticipants WHERE room_id = :room_id"
                    ),
                    {"room_id": room_id},
                ).fetchall()
                user_ids = [row[0] for row in participants]
                total_participants = len(user_ids)

                # ✅ 보낸 사람은 자동 읽음 처리됨 → 나머지가 unread 대상
                unread_count = total_participants - 1

                # ✅ 로그
                print("[브로드캐스트 대상]", user_ids)
                print(f"📨 메시지 unread_count = {unread_count}")

                # ✅ 메시지 전송
                await manager.broadcast_to_room(
                    user_ids,
                    {
                        "type": "message",
                        "room_id": room_id,
                        "message_id": chat_message.message_id,
                        "sender_id": user_id,
                        "sender": {
                            "user_id": user.user_id,
                            "nickname": user.nickname,
                            "profile_image_url": user.profile_image_url,
                        },
                        "message": message,
                        "message_type": message_type,
                        "message_metadata": message_metadata,
                        "file_url": file_url,
                        "sent_at": chat_message.sent_at.isoformat(),
                        "unread_count": unread_count,
                    },
                )

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
