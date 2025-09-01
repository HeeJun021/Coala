# app/services/attendance_service.py
from __future__ import annotations

from datetime import date, datetime, timezone, timedelta
from typing import List, Optional, Tuple

from sqlalchemy import select, func, text, bindparam, Date
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.attendance_models import (
    AttendanceQuestion,
    AttendanceCalendar,
    UserAttendance,
)
from app.schemas.attendance_schema import (
    AttendanceQuestionCreate,
    AttendanceQuestionUpdate,
    AttendanceCheckRequest,
)

# Python 3.9+ 표준 tz
try:
    from zoneinfo import ZoneInfo  # type: ignore
except Exception:  # pragma: no cover
    ZoneInfo = None  # type: ignore


# ------------------------------------------------------------
# 유틸: 타임존 기준 '오늘' 날짜
# ------------------------------------------------------------
def today_in_tz(tz_name: Optional[str] = None) -> date:
    """
    기본 Asia/Seoul. tzdata 미설치/미지원이어도 안전하게 동작하도록 폴백.
    """
    tz = tz_name or "Asia/Seoul"
    if ZoneInfo:
        try:
            return datetime.now(ZoneInfo(tz)).date()
        except Exception:
            # tzdata 없거나 미지원인 타임존일 때 폴백
            pass
    # KST 요청이면 UTC+9로 계산, 그 외엔 UTC 날짜로 폴백
    if tz in ("Asia/Seoul", "KST", "ROK", None):
        return (datetime.now(timezone.utc) + timedelta(hours=9)).date()
    return datetime.now(timezone.utc).date()



# ------------------------------------------------------------
# 질문(Question) 서비스
# ------------------------------------------------------------
def create_question(db: Session, payload: AttendanceQuestionCreate) -> AttendanceQuestion:
    q = AttendanceQuestion(
        question_text=payload.question_text,
        choices=payload.choices,
        correct_answer=payload.correct_answer,
        is_active=payload.is_active,
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


def update_question(db: Session, att_question_id: int, payload: AttendanceQuestionUpdate) -> AttendanceQuestion:
    q = db.get(AttendanceQuestion, att_question_id)
    if not q:
        raise ValueError("question_not_found")

    # 부분 수정 반영
    if payload.question_text is not None:
        q.question_text = payload.question_text
    if payload.choices is not None:
        q.choices = payload.choices
        # correct_answer도 함께 바뀌지 않았다면, 기존 값이 신규 choices에 포함되는지 검증은 DB/서비스 레벨에서 보장
        if q.correct_answer not in q.choices:
            raise ValueError("correct_answer_not_in_choices")
    if payload.correct_answer is not None:
        # choices가 함께 넘어오지 않았다면 기존 choices 기준으로 검증
        if q.choices and payload.correct_answer not in q.choices:
            raise ValueError("correct_answer_not_in_choices")
        q.correct_answer = payload.correct_answer
    if payload.is_active is not None:
        q.is_active = payload.is_active

    db.commit()
    db.refresh(q)
    return q


def list_questions(
    db: Session,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
) -> List[AttendanceQuestion]:
    stmt = select(AttendanceQuestion).order_by(AttendanceQuestion.att_question_id.desc())
    if is_active is not None:
        stmt = stmt.where(AttendanceQuestion.is_active == is_active)
    stmt = stmt.offset(skip).limit(limit)
    return db.execute(stmt).scalars().all()


# ------------------------------------------------------------
# 캘린더(Calendar) 서비스
# ------------------------------------------------------------

def ensure_calendar_for_date(db: Session, the_date: date) -> Optional[AttendanceCalendar]:
    # 이미 있으면 그대로 반환
    cal = db.get(AttendanceCalendar, the_date)
    if cal:
        return cal

    # 활성 문제 선택(정책은 random/round-robin 등으로 바꿀 수 있음)
    qid = (
        db.query(AttendanceQuestion.att_question_id)
        .filter(AttendanceQuestion.is_active.is_(True))
        .order_by(func.random())
        .limit(1)
        .scalar()
    )
    if not qid:
        return None

    # 경합 안전: ON CONFLICT DO NOTHING 후 다시 조회
    try:
        db.execute(
            text("""
                INSERT INTO attendance_calendar(att_date, att_question_id)
                VALUES (:d, :qid)
                ON CONFLICT (att_date) DO NOTHING
            """),
            {"d": the_date, "qid": qid},
        )
        db.commit()
    except IntegrityError:
        db.rollback()

    return db.get(AttendanceCalendar, the_date)

def get_calendar_by_date(db: Session, the_date: date) -> Optional[AttendanceCalendar]:
    return db.get(AttendanceCalendar, the_date)


def upsert_calendar(db: Session, the_date: date, att_question_id: int) -> AttendanceCalendar:
    cal = db.get(AttendanceCalendar, the_date)
    if cal:
        cal.att_question_id = att_question_id
    else:
        cal = AttendanceCalendar(att_date=the_date, att_question_id=att_question_id)
        db.add(cal)
    db.commit()
    db.refresh(cal)
    return cal


def get_calendar_with_question(db: Session, the_date: date) -> Optional[AttendanceCalendar]:
    """
    lazy='joined'로 question 조인되도록 모델이 설정되어 있음.
    """
    return db.get(AttendanceCalendar, the_date)


def get_today_calendar_with_question(
    db: Session,
    tz_name: Optional[str] = None,
    auto_create: bool = True,
) -> Optional[AttendanceCalendar]:
    d = today_in_tz(tz_name)
    cal = get_calendar_with_question(db, d)
    if not cal and auto_create:
        cal = ensure_calendar_for_date(db, d)
        if cal:
            # question 관계가 lazy='joined'라면 그대로 OK지만,
            # 안전하게 다시 로드해 반환
            cal = get_calendar_with_question(db, d)
    return cal



# ------------------------------------------------------------
# 출석(Attendance) 서비스
# ------------------------------------------------------------
def list_user_attendance(
    db: Session,
    user_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 50,
) -> List[UserAttendance]:
    stmt = select(UserAttendance).where(UserAttendance.user_id == user_id)
    if start_date:
        stmt = stmt.where(UserAttendance.att_date >= start_date)
    if end_date:
        stmt = stmt.where(UserAttendance.att_date <= end_date)
    stmt = stmt.order_by(UserAttendance.att_date.desc()).offset(skip).limit(limit)
    return db.execute(stmt).scalars().all()


def check_and_record_attendance(
    db: Session,
    user_id: int,
    req: AttendanceCheckRequest,
) -> Tuple[bool, bool, Optional[datetime], str]:
    """
    반환: (is_correct, created, checkin_ts, message)
      - is_correct: 정답 여부
      - created: 새 레코드 생성 여부 (이미 출석했으면 False)
      - checkin_ts: 생성/기존 출석 시각
      - message: 설명 메시지
    """
    # 1) 해당 날짜의 문제 매핑 확인
    calendar = get_calendar_with_question(db, req.att_date)
    if not calendar:
        return (False, False, None, "no_calendar_for_date")

    # 2) 정답 검증
    selected = (req.selected_answer or "").strip()
    correct = (calendar.question.correct_answer or "").strip()
    is_correct = selected == correct
    if not is_correct:
        return (False, False, None, "incorrect_answer")

    # 3) 이미 출석했는지 확인 (낙관적 삽입 + 예외 처리)
    existing = db.execute(
        select(UserAttendance).where(
            UserAttendance.user_id == user_id,
            UserAttendance.att_date == req.att_date,
        )
    ).scalar_one_or_none()
    if existing:
        return (True, False, existing.checkin_ts, "already_checked_in")

    ua = UserAttendance(user_id=user_id, att_date=req.att_date)
    db.add(ua)
    try:
        db.commit()
        db.refresh(ua)
        return (True, True, ua.checkin_ts, "checked_in")
    except IntegrityError:
        db.rollback()
        # 유니크 충돌 등: 이미 체크인으로 간주하고 기존 레코드 반환
        existing = db.execute(
            select(UserAttendance).where(
                UserAttendance.user_id == user_id,
                UserAttendance.att_date == req.att_date,
            )
        ).scalar_one_or_none()
        if existing:
            return (True, False, existing.checkin_ts, "already_checked_in")
        # 드문 케이스: 다른 무결성 오류
        return (True, False, None, "integrity_error")

def count_attendance_on_date(db: Session, the_date: date) -> int:
    """해당 날짜의 출석 사용자 수"""
    return db.query(func.count(UserAttendance.attendance_id))\
             .filter(UserAttendance.att_date == the_date)\
             .scalar() or 0

def count_attendance_today(db: Session, tz_name: Optional[str] = None) -> tuple[date, int]:
    d = today_in_tz(tz_name)
    return d, count_attendance_on_date(db, d)

def list_daily_counts(db: Session, start_date: date, end_date: date) -> list[tuple[date, int]]:
    rows = db.execute(
        text("""
            SELECT d::date AS date, COUNT(u.attendance_id)::int AS count
            FROM generate_series((:s)::date, (:e)::date, interval '1 day') AS d
            LEFT JOIN user_attendance u ON u.att_date = d::date
            GROUP BY d
            ORDER BY d
        """).bindparams(
            bindparam("s", type_=Date),
            bindparam("e", type_=Date),
        ),
        {"s": start_date, "e": end_date},
    ).all()
    return [(r.date, r.count) for r in rows]

def list_user_daily_flags(db: Session, user_id: int, start_date: date, end_date: date) -> list[tuple[date, bool]]:
    rows = db.execute(
        text("""
            SELECT d::date AS date,
                   (COUNT(u.attendance_id) > 0) AS checked_in
            FROM generate_series((:s)::date, (:e)::date, interval '1 day') AS d
            LEFT JOIN user_attendance u
              ON u.att_date = d::date
             AND u.user_id  = :uid
            GROUP BY d
            ORDER BY d
        """).bindparams(
            bindparam("s", type_=Date),
            bindparam("e", type_=Date),
            bindparam("uid"),
        ),
        {"s": start_date, "e": end_date, "uid": user_id},
    ).all()
    return [(r.date, bool(r.checked_in)) for r in rows]