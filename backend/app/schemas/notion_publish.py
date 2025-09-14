# Pydantic v2 기준 (from_attributes 사용)
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class NotionPublishRequest(BaseModel):
    template_id: int
    target_page_id: str                     # 사용자가 공유한 Notion 대상 페이지
    project_id: int                         # ✅ 단일 프로젝트만 허용
    ai_prompt: Optional[str] = Field(None)  # ✅ 새로 추가된 필드 (사용자 입력 설명)

    # (선택) 프론트에서 들어오는 추가 치환값(우선순위 가장 높음)
    extra_kv: Optional[Dict[str, Any]] = None

class NotionPublishResponse(BaseModel):
    success: bool
    created_page_id: Optional[str] = None
    export_history_id: Optional[int] = None
    missing_keys: List[str] = []
    message: Optional[str] = None
