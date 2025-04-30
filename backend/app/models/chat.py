from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from app.database import Base

# 1. 채팅방 테이블
class ChatRoom(Base):
    __tablename__ = "chatrooms"

    room_id = Column(Integer, primary_key=True, index=True)
    room_type = Column(String(20), nullable=False)  # 'general', 'mentoring', 'team'
    is_group = Column(Boolean, default=False)
    room_name = Column(String(100), nullable=True)  # ✅ 채팅방 이름
    created_at = Column(TIMESTAMP, server_default=func.now())


# 2. 채팅방 참여자 테이블
class ChatRoomParticipant(Base):
    __tablename__ = "chatroomparticipants"

    room_id = Column(Integer, ForeignKey("chatrooms.room_id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    joined_at = Column(TIMESTAMP, server_default=func.now())
    is_pinned = Column(Boolean, default=False)
    
    # ✅ 추가된 필드들
    last_read_message_id = Column(Integer, nullable=True)
    last_read_at = Column(TIMESTAMP, nullable=True)
    is_archived = Column(Boolean, default=False)
    is_muted = Column(Boolean, default=False)


# 3. 채팅 메시지 테이블
class ChatMessage(Base):
    __tablename__ = "chatmessages"

    message_id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("chatrooms.room_id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=True)
    message_type = Column(String(10), default="text")  # 'text', 'file', 'image'
    file_url = Column(Text, nullable=True)
    sent_at = Column(TIMESTAMP, server_default=func.now())
    read_count = Column(Integer, default=0)


# 4. 친구 관계 테이블
class UserFriend(Base):
    __tablename__ = "userfriends"

    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    friend_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    is_accepted = Column(Boolean, default=False)
    requested_at = Column(TIMESTAMP, server_default=func.now())
    accepted_at = Column(TIMESTAMP, nullable=True)
