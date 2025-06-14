from sqlalchemy import update, insert, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict
from app.models.coding_tests import CorrectSubmissionStats, CodingTestSubmissions, CodingTestSubmissions, CodingTests
from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.schemas.coding_tests import SubmissionTitleUpdate, SubmissionStatsResponse
from app.routers.auth import get_current_user
from sqlalchemy import func
from pytz import timezone  # ⬅️ 추가

router = APIRouter(
    prefix="/codingtestsubmissions",
    tags=["CodingTestSubmissions"]
)

# 동기 버전으로 수정
def update_correct_stats(db: Session, test_id: int, is_correct: bool):
    query = select(CorrectSubmissionStats).where(CorrectSubmissionStats.test_id == test_id)
    result = db.execute(query)
    existing = result.scalar_one_or_none()

    if existing:
        total = existing.total_submissions + 1
        correct = existing.correct_submissions + (1 if is_correct else 0)
        correct_rate = (correct / total) * 100

        stmt = (
            update(CorrectSubmissionStats)
            .where(CorrectSubmissionStats.test_id == test_id)
            .values(
                total_submissions=total,
                correct_submissions=correct,
                correct_rate=correct_rate
            )
        )
        db.execute(stmt)

    else:
        total = 1
        correct = 1 if is_correct else 0
        correct_rate = correct * 100

        stmt = insert(CorrectSubmissionStats).values(
            test_id=test_id,
            total_submissions=total,
            correct_submissions=correct,
            correct_rate=correct_rate
        )
        try:
            db.execute(stmt)
        except IntegrityError:
            pass

    db.commit()


# ✅ 제출 제목 단독 수정 API
@router.patch("/{submission_id}/title")
def update_submission_title(
    submission_id: int,
    data: SubmissionTitleUpdate,
    db: Session = Depends(get_db)
):
    submission = db.query(CodingTestSubmissions).filter(
        CodingTestSubmissions.ct_submission_id == submission_id
    ).first()

    if not submission:
        raise HTTPException(status_code=404, detail="제출을 찾을 수 없습니다.")

    submission.title = data.title
    db.commit()
    db.refresh(submission)

    return {
        "result": "success",
        "updated_title": submission.title
    }
    

# 코딩테스트 통계 조회
@router.get("/stats", response_model=SubmissionStatsResponse)
def get_submission_stats(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]

    # 전체 제출 / 정답 제출
    total = db.query(CodingTestSubmissions).filter_by(user_id=user_id).count()
    correct = db.query(CodingTestSubmissions).filter_by(user_id=user_id, is_correct=True).count()

    # 정답률
    accuracy = round(correct / total * 100, 1) if total > 0 else 0.0

    # 난이도별 정답 수
    difficulty_map = {
        0: "very_easy", 1: "easy", 2: "normal", 3: "medium", 4: "hard", 5: "very_hard"
    }

    raw_difficulty = (
        db.query(CodingTests.difficulty, db.query(CodingTestSubmissions)
            .filter(CodingTestSubmissions.user_id == user_id, CodingTestSubmissions.is_correct == True)
            .filter(CodingTestSubmissions.test_id == CodingTests.test_id)
            .with_entities(CodingTests.difficulty)
            .subquery())
        .with_entities(CodingTests.difficulty, func.count())
        .join(CodingTestSubmissions, CodingTests.test_id == CodingTestSubmissions.test_id)
        .filter(CodingTestSubmissions.user_id == user_id, CodingTestSubmissions.is_correct == True)
        .group_by(CodingTests.difficulty)
        .all()
    )
    solved_by_difficulty: Dict[str, int] = {
        difficulty_map.get(diff, str(diff)): count for diff, count in raw_difficulty
    }

    # ✅ 한국 시간 기준 오늘 날짜로 설정
    KST = timezone("Asia/Seoul")
    today = datetime.now(KST).date()
    start_date = today - timedelta(days=6)

    result = (
        db.query(func.date(CodingTestSubmissions.submitted_at), func.count())
        .filter(CodingTestSubmissions.user_id == user_id)
        .filter(CodingTestSubmissions.submitted_at >= start_date)
        .group_by(func.date(CodingTestSubmissions.submitted_at))
        .all()
    )
    date_map = {r[0].isoformat(): r[1] for r in result}
    weekly_submissions = []
    for i in range(7):
        day = (start_date + timedelta(days=i)).isoformat()
        weekly_submissions.append({"date": day, "count": date_map.get(day, 0)})

    return SubmissionStatsResponse(
        totalSubmissions=total,
        correctSubmissions=correct,
        accuracy=accuracy,
        solvedByDifficulty=solved_by_difficulty,
        weeklySubmissions=weekly_submissions,
    )