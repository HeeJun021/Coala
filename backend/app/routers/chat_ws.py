from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import List
from app.services.connection_manager import ConnectionManager
from app.database import SessionLocal
from app.models.chat import ChatMessage
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

router = APIRouter()
manager = ConnectionManager()


# DB 세션 의존성
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.websocket("/ws/user/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    await manager.connect(user_id, websocket)

    try:
        while True:
            data = await websocket.receive_json()  # { "room_id": 1, "message": "안녕!" }

            room_id = data.get("room_id")
            message = data.get("message")

            # 1. 메시지 DB 저장
            chat_message = ChatMessage(
                room_id=room_id,
                sender_id=user_id,
                message=message,
                message_type="text"
            )
            db.add(chat_message)
            db.commit()

            # 2. 채팅방 참여자 user_id 목록 DB에서 조회
            participants = db.execute(
                """
                SELECT user_id FROM chatroomparticipants WHERE room_id = :room_id
                """,
                {"room_id": room_id}
            ).fetchall()
            user_ids = [row[0] for row in participants]

            # 3. 참여자 전체에게 메시지 전송
            await manager.broadcast_to_room(user_ids, message)

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
