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
    room_id: Optional[str] = websocket.query_params.get("room_id")

    # ✅ access_token은 쿠키에서 추출
    headers = Headers(scope=websocket.scope)
    cookie_header = headers.get("cookie")

    token: Optional[str] = None
    if cookie_header:
        cookies = SimpleCookie()
        cookies.load(cookie_header)
        if "access_token" in cookies:
            token = cookies["access_token"].value

    print("🍪 cookie_header:", cookie_header)
    print("🔐 extracted token:", token)

    # ✅ 둘 중 하나라도 없으면 종료
    if token is None or room_id is None:
        await websocket.close(code=1008)
        return
    room_id = int(room_id)

    user = get_user_from_token(token, db)
    if not user:
        await websocket.close(code=1008)
        return

    user_id = user.user_id
    await manager.connect(user_id, websocket)

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

                    await manager.broadcast_to_room(
                        user_ids,
                        {
                            "type": "read",
                            "message_id": message_id,
                            "user_id": user_id,
                        },
                    )
                continue

            # ✅ 메시지 전송
            if event_type == "message":
                message = data.get("message")
                message_type = data.get("message_type", "text")
                file_url = data.get("file_url")

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

                # 참여자 조회
                participants = db.execute(
                    text("SELECT user_id FROM chatroomparticipants WHERE room_id = :room_id"),
                    {"room_id": room_id},
                ).fetchall()
                user_ids = [row[0] for row in participants]

                await manager.broadcast_to_room(
                    user_ids,
                    {
                        "room_id": room_id,
                        "message_id": chat_message.message_id,
                        "sender_id": user_id,
                        "message": message,
                        "message_type": message_type,
                        "file_url": file_url,
                        "sent_at": chat_message.sent_at.isoformat(),
                    },
                )

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
