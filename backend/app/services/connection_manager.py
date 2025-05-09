from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
        self.global_connections: List[WebSocket] = []  # ✅ 추가

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        self.global_connections.append(websocket)  # ✅ 전역 리스트에 추가

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        if websocket in self.global_connections:
            self.global_connections.remove(websocket)  # ✅ 전역 리스트에서도 제거

    async def send_personal_message(self, user_id: int, message: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_json(message)

    async def broadcast_to_room(self, user_ids: List[int], message: dict):
        for user_id in user_ids:
            await self.send_personal_message(user_id, message)

    async def broadcast_all(self, message: dict):
        print("📢 [broadcast_all 호출됨]:", message)
        for socket in self.global_connections:
            try:
                await socket.send_json(message)
            except Exception as e:
                print(f"🚨 Error sending broadcast_all: {e}")