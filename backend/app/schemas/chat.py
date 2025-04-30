from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ChatRoomCreateRequest(BaseModel):
    room_type: str               # 'general', 'mentoring', 'team'
    is_group: bool
    participant_ids: List[int]

class ChatRoomCreateResponse(BaseModel):
    room_id: int
    
# 채팅방 목록 항목 스키마
class ChatRoomListItem(BaseModel):
    room_id: int
    room_type: str
    is_group: bool
    room_name: Optional[str]
    is_pinned: bool
    joined_at: datetime
    last_message: Optional[str]
    last_message_time: Optional[datetime]
    unread_count: int
