# app/routers/attendance.py
from __future__ import annotations

from datetime import date
from typing import List, Optional, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db  # 프로젝트의 실제 위치에 맞게 조정
from app.models.user import User  # User 모델 경로 확인
from app.schemas.attendance_schema import (
    AttendanceQuestionCreate,
    AttendanceQuestionUpdate,
    AttendanceQuestionOut,
    AttendanceCalendarCreate,
    AttendanceCalendarOut,
    AttendanceCalendarWithQuestionOut,
    AttendanceCheckRequest,
    AttendanceCheckResponse,
    UserAttendanceOut,
    AttendanceCountOut, 
    AttendanceFlagOut,
)
from app.services import attendance_service as svc

from app.services.user import reward_user_by_action
from app.schemas.eucalyptus_schema import RewardActionType

# 인증 의존성 (경로는 프로젝트에 맞게 조정)
# 예: from app.routers.auth import get_current_user
from app.routers.auth import get_current_user  # 필요시 경로 수정


router = APIRouter(prefix="/attendance", tags=["Attendance"])


def _get_user_id(user: Any) -> int:
    # dict 형태
    if isinstance(user, dict):
        if user.get("user_id") is not None:
            return int(user["user_id"])
        if user.get("id") is not None:
            return int(user["id"])
        raise HTTPException(status_code=401, detail="invalid_user_payload")
    # 객체 형태
    if hasattr(user, "user_id") and getattr(user, "user_id") is not None:
        return int(getattr(user, "user_id"))
    if hasattr(user, "id") and getattr(user, "id") is not None:
        return int(getattr(user, "id"))
    raise HTTPException(status_code=401, detail="invalid_user_payload")


# 관리자 권한 확인 (dict/객체 모두 지원)
def require_admin(current_user: Any = Depends(get_current_user)) -> Any:
    is_admin = (
        bool(current_user.get("is_admin", False))
        if isinstance(current_user, dict)
        else bool(getattr(current_user, "is_admin", False))
    )
    if not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="admin_only")
    return current_user



# ------------------------------------------------------------
# 사용자 API
# ------------------------------------------------------------
@router.get(
    "/today",
    response_model=AttendanceCalendarWithQuestionOut,
    summary="오늘의 출석 문제 조회 (기본 KST, 자동 생성)",
)
def get_today_question(
    tz: Optional[str] = Query(None, description="IANA 타임존, 미지정 시 Asia/Seoul"),
    db: Session = Depends(get_db),
):
    cal = svc.get_today_calendar_with_question(db, tz_name=tz, auto_create=True)
    if not cal:
        # 활성 문제가 하나도 없는 경우도 포함
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="no_calendar_or_no_active_question")
    return cal


@router.post(
    "/check",
    response_model=AttendanceCheckResponse,
    summary="출석 제출 (정답 시 1회 출석 인정)",
)
def check_attendance(
    payload: AttendanceCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_id = _get_user_id(current_user)

    is_correct, created, ts, message = svc.check_and_record_attendance(
        db=db,
        user_id=user_id,
        req=payload,
    )

    # 기본 응답
    resp = {
        "att_date": payload.att_date,
        "is_correct": is_correct,
        "created": created,
        "checkin_ts": ts,
        "message": message,
    }

    # 정답 + 오늘 '최초' 출석일 때만 유칼립투스 지급
    if is_correct and created:
        try:
            # current_user가 dict일 수도 있으므로 ORM 객체 보장
            user_obj = (
                db.get(User, user_id)
                if isinstance(current_user, dict)
                else current_user
            )
            amount = reward_user_by_action(
                user=user_obj,
                action=RewardActionType.daily_attendance,
                db=db,
                # amount=원하면 여기서 오버라이드 가능
            )
            resp["reward_amount"] = amount  # 스키마에 없으면 자동 필터링됨
        except HTTPException as e:
            # 출석 자체는 성공이므로 지급 실패는 정보로만 전달
            resp["reward_error"] = e.detail
        except Exception:
            resp["reward_error"] = "reward_failed"

    return resp



@router.get(
    "/me",
    response_model=List[UserAttendanceOut],
    summary="내 출석 이력 조회",
)
def get_my_attendance(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_id = _get_user_id(current_user)
    
    skip = (page - 1) * limit
    rows = svc.list_user_attendance(
        db=db,
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )
    return rows

@router.get(
    "/today_count",
    response_model=AttendanceCountOut,
    summary="오늘 출석한 사용자 수(공개, 기본 KST)",
)
def today_count(
    tz: Optional[str] = Query(None, description="IANA 타임존, 미지정 시 Asia/Seoul"),
    db: Session = Depends(get_db),
):
    d, cnt = svc.count_attendance_today(db, tz_name=tz)
    return {"date": d, "count": cnt}


@router.get(
    "/daily_counts",
    response_model=List[AttendanceCountOut],
    summary="일자별 출석 수(공개)",
)
def daily_counts(
    start_date: date = Query(..., description="YYYY-MM-DD"),
    end_date: date = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    rows = svc.list_daily_counts(db, start_date, end_date)
    return [{"date": d, "count": c} for d, c in rows]

@router.get(
    "/me/daily_flags",
    response_model=List[AttendanceFlagOut],
    summary="기간별 내 출석 여부 플래그(로그인 필요)",
)
def me_daily_flags(
    start_date: date = Query(..., description="YYYY-MM-DD"),
    end_date:   date = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    user_id = _get_user_id(current_user)
    rows = svc.list_user_daily_flags(db, user_id, start_date, end_date)
    return [{"date": d, "checked_in": f} for d, f in rows]


@router.get(
    "/date/{att_date}/count",
    response_model=AttendanceCountOut,
    summary="특정 날짜 출석한 사용자 수(공개)",
)
def date_count(
    att_date: date,
    db: Session = Depends(get_db),
):
    cnt = svc.count_attendance_on_date(db, att_date)
    return {"date": att_date, "count": cnt}

# ------------------------------------------------------------
# 관리자 API
# ------------------------------------------------------------
@router.post(
    "/admin/questions",
    response_model=AttendanceQuestionOut,
    summary="출석 문제 생성(관리자)",
)
def admin_create_question(
    payload: AttendanceQuestionCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        return svc.create_question(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/admin/questions",
    response_model=List[AttendanceQuestionOut],
    summary="출석 문제 리스트(관리자)",
)
def admin_list_questions(
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    skip = (page - 1) * limit
    return svc.list_questions(db, is_active=is_active, skip=skip, limit=limit)


@router.patch(
    "/admin/questions/{att_question_id}",
    response_model=AttendanceQuestionOut,
    summary="출석 문제 수정(관리자, 부분수정)",
)
def admin_update_question(
    att_question_id: int,
    payload: AttendanceQuestionUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    try:
        return svc.update_question(db, att_question_id, payload)
    except ValueError as e:
        # question_not_found / correct_answer_not_in_choices
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/admin/calendar",
    response_model=AttendanceCalendarOut,
    summary="날짜-문제 매핑 생성/갱신(관리자, upsert)",
)
def admin_upsert_calendar(
    payload: AttendanceCalendarCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    # 존재하면 수정, 없으면 생성
    cal = svc.upsert_calendar(db, payload.att_date, payload.att_question_id)
    return cal


@router.get(
    "/admin/calendar/{att_date}",
    response_model=AttendanceCalendarWithQuestionOut,
    summary="해당 날짜의 출석 문제 조회(관리자)",
)
def admin_get_calendar(
    att_date: date,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    cal = svc.get_calendar_with_question(db, att_date)
    if not cal:
        raise HTTPException(status_code=404, detail="no_calendar_for_date")
    return cal

@router.get(
    "/admin/daily_counts",
    response_model=List[AttendanceCountOut],
    summary="일자별 출석 수(관리자)",
)
def admin_daily_counts(
    start_date: date = Query(..., description="YYYY-MM-DD"),
    end_date: date = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
    _: Any = Depends(require_admin),
):
    rows = svc.list_daily_counts(db, start_date, end_date)
    return [{"date": d, "count": c} for d, c in rows]

