# app/models/attendance_models.py
from __future__ import annotations

from sqlalchemy import (
    Column, Integer, Text, Boolean, Date, ForeignKey, TIMESTAMP,
    CheckConstraint, UniqueConstraint, Index, text
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship, declarative_mixin
from app.database import Base  # Base 경로 확인 필요

# -------------------------------------------------------------------
# 출석 전용 MCQ(4지선다) 문제
# DDL과 동일: choices TEXT[] (길이 4), correct_answer ∈ choices
# -------------------------------------------------------------------
class AttendanceQuestion(Base):
    __tablename__ = "attendance_questions"

    att_question_id = Column(Integer, primary_key=True, autoincrement=True)
    question_text   = Column(Text, nullable=False)
    choices         = Column(ARRAY(Text), nullable=False)  # 예: ['A', 'B', 'C', 'D']
    correct_answer  = Column(Text, nullable=False)         # 보기 중 하나
    is_active       = Column(Boolean, nullable=False, server_default=text("true"))
    created_at      = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("now()"))

    # 제약 (DB 레벨)
    __table_args__ = (
        CheckConstraint("array_length(choices, 1) = 4", name="chk_choices_len4"),
        CheckConstraint("correct_answer = ANY (choices)", name="chk_answer_in_choice"),
    )

    # 관계: 날짜 매핑 레코드들
    calendars = relationship(
        "AttendanceCalendar",
        back_populates="question",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<AttendanceQuestion id={self.att_question_id}>"

# -------------------------------------------------------------------
# 날짜 ↔ 오늘의 문제 매핑
# DDL과 동일: att_date PK, att_question_id FK (RESTRICT)
# -------------------------------------------------------------------
class AttendanceCalendar(Base):
    __tablename__ = "attendance_calendar"

    att_date        = Column(Date, primary_key=True)
    att_question_id = Column(
        Integer,
        ForeignKey("attendance_questions.att_question_id", ondelete="RESTRICT"),
        nullable=False,
    )
    created_at      = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("now()"))

    # 관계
    question = relationship(
        "AttendanceQuestion",
        back_populates="calendars",
        lazy="joined",
    )
    attendances = relationship(
        "UserAttendance",
        back_populates="calendar",
        passive_deletes=True,
    )

# 인덱스 (DDL 반영)
Index("idx_attcal_question", AttendanceCalendar.att_question_id)

# -------------------------------------------------------------------
# 유저 출석 이력 (하루 1회)
# DDL과 동일: (user_id, att_date) UNIQUE, att_date → calendar.att_date CASCADE
# -------------------------------------------------------------------
class UserAttendance(Base):
    __tablename__ = "user_attendance"

    attendance_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id       = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    att_date      = Column(Date, ForeignKey("attendance_calendar.att_date", ondelete="CASCADE"), nullable=False)
    checkin_ts    = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("now()"))

    __table_args__ = (
        UniqueConstraint("user_id", "att_date", name="uq_user_att"),
    )

    # 관계
    calendar = relationship(
        "AttendanceCalendar",
        back_populates="attendances",
        lazy="joined",
    )
    # User 모델과의 관계는 순환 import 가능성이 있어 기본적으로 생략
    # 필요 시 아래 한 줄 활성화 (User 클래스 문자열 참조)
    # user = relationship("User", backref="attendance_records")

# 날짜 집계 인덱스 (DDL 반영)
Index("idx_user_att_date", UserAttendance.att_date)
