from pydantic import BaseModel
from typing import List, Optional

# 🔹 개별 이력 항목
class ExportHistoryItem(BaseModel):
    export_id: int
    title: str
    status: str
    block_count: int
    duration_ms: int
    created_at: str
    page_id: Optional[str] = None
    project_id: Optional[int] = None
    project_name: Optional[str] = None   # 🔹 추가
    template_name: Optional[str] = None   # 🔹 템플릿명
    ai_used: bool                        # 🔹 추가
    error_msg: Optional[str] = None      # 🔹 실패 시 메세지

    model_config = {"from_attributes": True}



# 🔹 전체 응답
class ExportHistoryListResponse(BaseModel):
    items: List[ExportHistoryItem]
    total: int

    model_config = {"from_attributes": True}
