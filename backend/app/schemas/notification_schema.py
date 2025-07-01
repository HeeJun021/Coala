from typing import Annotated
from datetime import datetime
from pydantic import BaseModel, Field

# ✅ 알림 생성용 스키마
class NotificationCreate(BaseModel):
    receiver_id: Annotated[int, Field(..., description="알림을 받을 사용자 ID")]
    type: Annotated[str, Field(..., description="알림 타입 (예: project_invite, message 등)")]
    content: Annotated[str, Field(..., description="알림 내용")]
    link_url: Annotated[str | None, Field(None, description="클릭 시 이동할 경로")] = None


# ✅ 알림 응답용 스키마
class NotificationResponse(BaseModel):
    notification_id: Annotated[int, Field(...)]
    sender_id: Annotated[int, Field(...)]
    receiver_id: Annotated[int, Field(...)]
    type: Annotated[str, Field(...)]
    content: Annotated[str, Field(...)]
    link_url: Annotated[str | None, Field(None)] = None
    is_read: Annotated[bool, Field(...)]
    created_at: Annotated[datetime, Field(...)]

    model_config = {
        "from_attributes": True  # Pydantic v2의 orm_mode
    }
