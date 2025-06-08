from sqlalchemy.dialects.postgresql import JSONB  # ✅ 추가 필요
from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, TIMESTAMP, DateTime
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
    
     # ✅ 여기에 추가!
    project_id = Column(Integer, ForeignKey("projects.project_id", ondelete="SET NULL"), nullable=True)


# 2. 채팅방 참여자 테이블
class ChatRoomParticipant(Base):
    __tablename__ = "chatroomparticipants"

    room_id = Column(Integer, ForeignKey("chatrooms.room_id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    joined_at = Column(TIMESTAMP, server_default=func.now())
    is_pinned = Column(Boolean, default=False)
    pinned_at = Column(TIMESTAMP, nullable=True)
    last_read_message_id = Column(Integer, nullable=True)
    last_read_at = Column(TIMESTAMP, nullable=True)
    is_archived = Column(Boolean, default=False)
    is_muted = Column(Boolean, default=False)
    custom_room_name = Column(String(100), nullable=True)
    is_deleted = Column(Boolean, default=False)


# 3. 채팅 메시지 테이블
class ChatMessage(Base):
    __tablename__ = "chatmessages"

    message_id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("chatrooms.room_id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=True)
    message_type = Column(String(30), default="text")  # 'text', 'file', 'image'
    file_url = Column(Text, nullable=True)
    file_name = Column(Text, nullable=True)
    file_size = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), nullable=True)
    sent_at = Column(TIMESTAMP, server_default=func.now())
    read_count = Column(Integer, default=0)
    
    message_metadata = Column(JSONB, nullable=True)
    
    
# 4. 메시지 읽은 수, 읽은 사람
class ChatMessageRead(Base):
    __tablename__ = "chatmessagereads"

    message_id = Column(
        Integer,
        ForeignKey("chatmessages.message_id", ondelete="CASCADE"),
        primary_key=True
    )
    user_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        primary_key=True
    )
    read_at = Column(TIMESTAMP, server_default=func.now())



# 5. 친구 관계 테이블
class UserFriend(Base):
    __tablename__ = "userfriends"

    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    friend_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    is_accepted = Column(Boolean, default=False)
    requested_at = Column(TIMESTAMP, server_default=func.now())
    accepted_at = Column(TIMESTAMP, nullable=True)
