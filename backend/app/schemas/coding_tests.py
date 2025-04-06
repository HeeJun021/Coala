from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CodingTestSubmissionCreate(BaseModel):
    user_id: int
    test_id: int
    code: str
    language: str

# ✅ 문제별 스타터 코드 조회용 스키마
class ProblemStarterCodeBase(BaseModel):
    test_id: int
    language: str


class ProblemStarterCodeCreate(ProblemStarterCodeBase):
    code: str


class ProblemStarterCodeResponse(BaseModel):
    starter_code_id: int
    language: str
    code: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
