from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.schemas.user import UserSimpleInfo


class ChatRoomCreateRequest(BaseModel):
    room_type: str  # 'general', 'mentoring', 'team'
    is_group: bool
    participant_ids: List[int]


class ChatRoomCreateResponse(BaseModel):
    room_id: int

class ChatParticipant(BaseModel):
    user_id: int
    nickname: str
    profile_url: Optional[str] = None  # 없어도 되도록 처리

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
    participants: List[ChatParticipant]  # ✅ 추가


# 채팅 보내기 요청, 응답
class ChatMessageCreateRequest(BaseModel):
    message: Optional[str] = None
    message_type: str = "text"  # 'text', 'file', 'image'
    file_url: Optional[str] = None
    file_name: Optional[str] = None          # ⬅️ 추가
    file_size: Optional[int] = None          # ⬅️ 추가
    uploaded_at: Optional[datetime] = None   # ⬅️ 추가


class ChatMessageCreateResponse(BaseModel):
    message_id: int
    room_id: int
    sender_id: int
    message: Optional[str]
    message_type: str
    file_url: Optional[str]
    file_name: Optional[str] = None          # ✅ 추가
    file_size: Optional[int] = None          # ✅ 추가
    uploaded_at: Optional[datetime] = None   # ✅ 추가
    sent_at: datetime


# 채팅 조회 스키마
class ChatMessageItem(BaseModel):
    message_id: int
    sender: UserSimpleInfo  # ✅ 통합 구조
    message: Optional[str]
    message_type: str
    file_url: Optional[str]
    file_name: Optional[str] = None          # ✅ 추가
    file_size: Optional[int] = None          # ✅ 추가
    uploaded_at: Optional[datetime] = None   # ✅ 추가
    sent_at: datetime
    read_count: int



# 채팅방 초대(요청 및 응답)
class ChatRoomInviteRequest(BaseModel):
    user_ids: List[int]  # 초대할 유저 ID 목록


class ChatRoomInviteResponse(BaseModel):
    room_id: int
    invited_user_ids: List[int]
    invited_user_nicknames: List[str]


# 채팅방 나가기 응답
class ChatRoomLeaveResponse(BaseModel):
    room_id: int
    room_deleted: bool


# 사용자별 채팅방 이름 변경 스키마
class ChatRoomRenameRequest(BaseModel):
    new_name: str


class ChatRoomRenameResponse(BaseModel):
    room_id: int
    custom_room_name: str


# 메시지 읽음
class ChatMessageReadRequest(BaseModel):
    last_read_message_id: int

# 채팅방 상단 고정
class ChatRoomPinToggleRequest(BaseModel):
    pinned: bool
    
class ChatRoomPinToggleResponse(BaseModel):
    room_id: int
    is_pinned: bool
    
    
# 채팅 보관함
class ChatRoomArchiveToggleRequest(BaseModel):
    archived: bool

class ChatRoomArchiveToggleResponse(BaseModel):
    room_id: int
    is_archived: bool