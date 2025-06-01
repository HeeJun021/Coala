from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# ✅ 문제 생성/수정용
class CodingTestBase(BaseModel):
    title: str
    description: str
    difficulty: int
    category: Optional[str] = None
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    time_limit: int = Field(..., gt=0)
    memory_limit: int = Field(default=256)

class CodingTestCreate(CodingTestBase):
    pass

class CodingTestUpdate(CodingTestBase):
    pass

# ✅ 문제 조회 응답용
class CodingTestResponse(CodingTestBase):
    test_id: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

# ✅ 테스트케이스
class CodingTestCaseBase(BaseModel):
    test_type: str
    example_input: str
    example_output: str
    is_hidden: bool = False

class CodingTestCaseCreate(CodingTestCaseBase):
    test_id: int

class CodingTestCaseUpdate(CodingTestCaseBase):
    pass

class CodingTestCaseResponse(CodingTestCaseBase):
    test_case_id: int

    model_config = {
        "from_attributes": True
    }

# ✅ 제약조건
class CodingTestConstraintBase(BaseModel):
    variable_name: str
    min_value: Optional[int] = None
    max_value: Optional[int] = None
    constraint_text: str

class CodingTestConstraintCreate(CodingTestConstraintBase):
    test_id: int

class CodingTestConstraintUpdate(CodingTestConstraintBase):
    pass

class CodingTestConstraintResponse(CodingTestConstraintBase):
    constraint_id: int

    model_config = {
        "from_attributes": True
    }

# ✅ 스타터 코드
class StarterCodeBase(BaseModel):
    language: str
    code: str

class StarterCodeCreate(StarterCodeBase):
    test_id: int

class StarterCodeUpdate(StarterCodeBase):
    pass

class StarterCodeResponse(StarterCodeBase):
    starter_code_id: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

# ✅ 통계 응답용
class CodingTestStatsResponse(BaseModel):
    test_id: int
    total_submissions: int
    correct_submissions: int
    correct_rate: float

    model_config = {
        "from_attributes": True
    }

class CodingTestSubmissionAdminResponse(BaseModel):
    submission_id: int
    user_id: int
    nickname: str
    is_correct: bool
    submitted_at: datetime
    title: Optional[str]
    code: str
    language: str
    execution_result: Optional[dict]

    model_config = {
        "from_attributes": True
    }