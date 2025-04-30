from fastapi import WebSocket
from typing import Dict, List


class ConnectionManager:
    def __init__(self):
        # user_id 기준으로 연결된 WebSocket 객체 목록 저장
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, user_id: int, message: str):
        # 특정 사용자에게 메시지 보내기
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_text(message)

    async def broadcast_to_room(self, user_ids: List[int], message: str):
        # 채팅방 참여자 전체에게 메시지 전송
        for user_id in user_ids:
            await self.send_personal_message(user_id, message)
