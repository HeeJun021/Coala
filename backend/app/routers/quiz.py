from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.services.quiz import get_all_quizzes, get_quiz, create_quiz
from app.models.question import Question
from app.models.quiz import QuizSubmissions, QuizSubmissionDetails
from app.schemas.quiz import QuizCreate, QuizResponse
from app.schemas.quiz import QuizSubmissionRequest
from app.utils.quiz import check_answer 
from app.models.user import User

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
    mode = submission_data.mode  # ✅ mode 값 받기 (practice / test)
    user_answers = submission_data.answers  # { "question_id": "user_answer" } 형태

    # 1️⃣ 퀴즈 제출 정보 저장
    submission = QuizSubmissions(
        quiz_id=quiz_id,
        user_id=user_id,
        correct_count=0  # 초기값 설정
    )
    db.add(submission)
    db.commit()  
    db.refresh(submission)  # ✅ 커밋 후 ID 참조 가능

    correct_count = 0  # 정답 개수
    total_questions = len(user_answers)  # 전체 문제 개수

    # 2️⃣ 제출된 문제 개별 검증
    for answer in user_answers:
        question_id = answer.question_id
        user_answer = answer.user_answer

        question = db.query(Question).filter(Question.question_id == question_id).first()

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

    # 4️⃣ 연습 모드에서는 점수 변동 없음
    if mode == "practice":
        submission.correct_count = correct_count
        db.commit()
        return {
            "message": "연습 퀴즈 제출 완료",
            "correct_count": correct_count
        }

    # 5️⃣ 테스트 모드: 정답률 계산 후 레이팅 변동
    correct_rate = correct_count / total_questions
    rating_change = 0

    if correct_rate >= 0.8:
        rating_change = 50  # ✅ 80% 이상 맞추면 +50점
    elif correct_rate >= 0.6:
        rating_change = 20  # ✅ 60~79% 정답이면 +20점
    elif correct_rate < 0.3:
        rating_change = -30  # ❌ 30% 미만 정답이면 -30점

    # ✅ 사용자 레이팅 업데이트
    user = db.query(User).filter(User.user_id == user_id).first()
    
    if mode == "test":
        if rating_change != 0:  # ✅ 이미 반영된 점수인지 확인
            user.rating = user.rating + rating_change
            db.commit()
            db.refresh(user)

    return {
        "message": "테스트 퀴즈 제출 완료",
        "correct_count": correct_count,
        "rating_change": rating_change
    }
