from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.services.quiz import get_all_quizzes, get_quiz, create_quiz
from app.schemas.quiz import QuizCreate, QuizResponse
from app.schemas.quiz import QuizSubmissionRequest

router = APIRouter(
    prefix="/quizzes",
    tags=["quizzes"]
)

# 1️⃣ 모든 퀴즈 조회 API
@router.get("/", response_model=List[QuizResponse])
def get_all(db: Session = Depends(get_db)):
    return get_all_quizzes(db)

@router.get("/{quiz_id}")
def fetch_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = get_quiz(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="해당 ID의 퀴즈를 찾을 수 없습니다.")

    return quiz

# 3️⃣ 퀴즈 생성 API
@router.post("/", response_model=QuizResponse)
def create(quiz_data: QuizCreate, db: Session = Depends(get_db)):
    return create_quiz(db, quiz_data.title, quiz_data.quiz_type, quiz_data.settings)

@router.post("/{quiz_id}/submit")
def submit_quiz(quiz_id: int, submission_data: QuizSubmissionRequest, db: Session = Depends(get_db)):
    """
    퀴즈 제출 API
    """
    user_id = submission_data.user_id
    user_answers = submission_data.answers  # { question_id: user_answer } 형태

    # 1️⃣ 퀴즈 제출 정보 저장
    submission = QuizSubmissions(quiz_id=quiz_id, user_id=user_id)
    db.add(submission)
    db.commit()
    db.refresh(submission)

    correct_count = 0  # 정답 개수

    # 2️⃣ 제출된 문제 개별 검증
    for question_id, user_answer in user_answers.items():
        question = db.query(Questions).filter(Questions.question_id == question_id).first()

        if not question:
            continue  # 문제 없음 → 스킵

        # ✅ 정답 비교 (문제 유형별 처리)
        is_correct = check_answer(question, user_answer)

        # 정답 카운트 증가
        if is_correct:
            correct_count += 1

        # 3️⃣ 제출 결과 저장
        submission_detail = QuizSubmissionDetails(
            submission_id=submission.submission_id,
            question_id=question_id,
            user_answer=user_answer,
            is_correct=is_correct
        )
        db.add(submission_detail)

    # 4️⃣ 점수 계산 및 반영
    submission.correct_count = correct_count
    db.commit()

    return {"message": "퀴즈 제출 완료", "correct_count": correct_count}