from sqlalchemy import update, insert, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.models.coding_tests import CorrectSubmissionStats, CodingTestSubmissions
from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.schemas.coding_tests import SubmissionTitleUpdate


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