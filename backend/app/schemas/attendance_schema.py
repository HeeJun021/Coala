# app/schemas/attendance_schema.py
from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict, field_validator


# =========================================================
# AttendanceQuestion (문제) 스키마
# =========================================================
class AttendanceQuestionBase(BaseModel):
    question_text: str = Field(..., description="문항 텍스트")
    choices: List[str] = Field(..., min_length=4, max_length=4, description="보기 4개 (정확히 4개)")
    correct_answer: str = Field(..., description="choices 중 하나")
    is_active: bool = Field(True, description="활성 여부")

    @field_validator("choices")
    @classmethod
    def validate_choices_len(cls, v: List[str]) -> List[str]:
        if len(v) != 4:
            raise ValueError("choices는 정확히 4개여야 합니다.")
        return v

    @field_validator("correct_answer")
    @classmethod
    def validate_answer_in_choices(cls, v: str, info):
        choices = info.data.get("choices") or []
        if v not in choices:
            raise ValueError("correct_answer는 choices 중 하나여야 합니다.")
        return v


class AttendanceQuestionCreate(AttendanceQuestionBase):
    """문제 생성 요청"""


class AttendanceQuestionUpdate(BaseModel):
    """문제 수정 요청 (부분 수정 허용)"""
    question_text: Optional[str] = None
    choices: Optional[List[str]] = Field(None, min_length=4, max_length=4)
    correct_answer: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("choices")
    @classmethod
    def validate_choices_len_for_update(cls, v: Optional[List[str]]):
        if v is not None and len(v) != 4:
            raise ValueError("choices는 정확히 4개여야 합니다.")
        return v

    @field_validator("correct_answer")
    @classmethod
    def validate_answer_in_choices_for_update(cls, v: Optional[str], info):
        if v is None:
            return v
        choices = info.data.get("choices")
        # choices가 함께 안 왔다면 기존 DB값과의 검증은 서비스 레벨에서 수행
        if choices is not None and v not in choices:
            raise ValueError("correct_answer는 choices 중 하나여야 합니다.")
        return v


class AttendanceQuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    att_question_id: int
    question_text: str
    choices: List[str]
    correct_answer: str
    is_active: bool
    created_at: datetime


# =========================================================
# AttendanceCalendar (날짜-문제 매핑) 스키마
# =========================================================
class AttendanceCalendarCreate(BaseModel):
    att_date: date = Field(..., description="YYYY-MM-DD")
    att_question_id: int = Field(..., description="배정할 문제 ID")


class AttendanceCalendarOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    att_date: date
    att_question_id: int
    created_at: datetime


class AttendanceCalendarWithQuestionOut(BaseModel):
    """날짜 + 문제 내용을 함께 반환할 때 사용"""
    model_config = ConfigDict(from_attributes=True)

    att_date: date
    created_at: datetime
    question: AttendanceQuestionOut


# =========================================================
# UserAttendance (출석 이력) 스키마
# =========================================================
class UserAttendanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    attendance_id: int
    user_id: int
    att_date: date
    checkin_ts: datetime


# =========================================================
# 체크인 요청/응답 (API에서 사용할 DTO)
# =========================================================
class AttendanceCheckRequest(BaseModel):
    """
    출석 제출 요청 DTO.
    - 일반적으로 사용자는 오늘 날짜(att_date)에 대해 보기 중 하나(selected_answer)를 제출.
    - 백엔드는 정답 여부 확인 후 맞으면 user_attendance에 insert.
    """
    att_date: date
    selected_answer: str


class AttendanceCheckResponse(BaseModel):
    att_date: date
    is_correct: bool
    # 이미 출석했던 경우 구분용
    created: bool = Field(..., description="새로 생성되었는지 여부 (중복 제출 방지)")
    checkin_ts: Optional[datetime] = None
    message: Optional[str] = None

# 일자별 출석 카운트 응답
class AttendanceCountOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: date
    count: int
    
class AttendanceFlagOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    date: date
    checked_in: bool