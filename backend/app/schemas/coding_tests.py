from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# ✅ 코드 제출 요청용 스키마
class CodingTestSubmissionCreate(BaseModel):
    user_id: int
    test_id: int
    code: str
    language: str
    title: Optional[str] = None  # 제출 제목 (기본값: "제출 1", "제출 2" 등 자동 생성)

# ✅ 문제별 스타터 코드 조회용 기본 스키마
class ProblemStarterCodeBase(BaseModel):
    test_id: int
    language: str

# ✅ 스타터 코드 생성 요청용 스키마
class ProblemStarterCodeCreate(ProblemStarterCodeBase):
    code: str

# ✅ 스타터 코드 조회 응답용 스키마
class ProblemStarterCodeResponse(BaseModel):
    starter_code_id: int
    language: str
    code: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

# ---------------------------------------------------------------
# ✅ 오답노트 관련 스키마
# ---------------------------------------------------------------

# ✅ 오답노트 생성 요청 스키마
class WrongNoteCreate(BaseModel):
    user_id: int
    ct_submission_id: int
    submitted_answer: str
    execution_result: str
    note: Optional[str] = None  # 마크다운 오답 내용

# ✅ 오답노트 조회 응답 스키마 (Pydantic v2 방식)
class WrongNoteResponse(BaseModel):
    note_id: int
    user_id: int
    ct_submission_id: int
    submitted_answer: str
    execution_result: str
    title: Optional[str] = None  # ✅ 제출 제목 추가
    note: Optional[str] = None
    created_at: Optional[datetime]

    model_config = {
        "from_attributes": True 
    }
    
# ✅ 오답노트 수정 요청 스키마
class WrongNoteUpdate(BaseModel):
    note: Optional[str] = None         # 마크다운 오답 내용
    title: Optional[str] = None        # 제출 제목도 수정 가능

    model_config = {
        "from_attributes": True
    }
    
# ✅ 제출 제목 수정용 스키마
class SubmissionTitleUpdate(BaseModel):
    title: str

    model_config = {
        "from_attributes": True
    }
    
    

class SolutionViewRequest(BaseModel):
    test_id: int