from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.services.quiz import get_all_quizzes, get_quiz, create_quiz
from app.models.question import Question
from app.models.quiz import Quiz, QuizSubmissions, QuizSubmissionDetails
from app.schemas.quiz import QuizCreate, QuizResponse, QuizResultResponse, QuizSubmissionRequest
from app.schemas.question import QuestionResult
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
        correct_count=0,  # 초기값 설정
        rating_change=0
    )
    db.add(submission)
    db.commit()  
    db.refresh(submission)  # ✅ 커밋 후 ID 참조 가능

    correct_count = 0  # 정답 개수
    total_questions = len(user_answers)  # 전체 문제 개수
    submission_details_list = []  # ✅ 한 번에 `commit()`할 리스트

    # 2️⃣ 제출된 문제 개별 검증
    for answer in user_answers:
        question_id = answer.question_id
        user_answer = answer.user_answer

        question = db.query(Question).filter(Question.question_id == question_id).first()

        if not question:
            continue  # 문제 없음 → 스킵

        # ✅ 정답 비교 (문제 유형별 처리)
        is_correct = check_answer(question, user_answer) or False  # ✅ `None` 방지

        # 정답 카운트 증가
        if is_correct:
            correct_count += 1

        # 3️⃣ 제출 결과 저장 (리스트에 추가)
        submission_details_list.append(QuizSubmissionDetails(
            submission_id=submission.submission_id,
            question_id=question_id,
            user_answer=user_answer,
            is_correct=is_correct
        ))

    # ✅ 모든 문제 추가 후 한 번만 `commit()` 실행
    if submission_details_list:
        db.add_all(submission_details_list)
        submission.correct_count = correct_count  # 정답 개수 업데이트
        db.commit()

    # ✅ 퀴즈를 푸는 도중 나갔을 때 처리
    else:
        db.delete(submission)
        db.commit()
        return {"message": "퀴즈가 제출되지 않았습니다. 다시 풀어주세요."}

    # ✅ 테스트 모드일 때 레이팅 반영
    rating_change = 0
    if mode == "test":
        correct_rate = correct_count / total_questions
        if correct_rate >= 0.8:
            rating_change = 50
        elif correct_rate >= 0.6:
            rating_change = 20
        elif correct_rate < 0.3:
            rating_change = -30

        # ✅ 사용자 레이팅 업데이트
        user = db.query(User).filter(User.user_id == user_id).first()
        user.rating += rating_change
        submission.rating_change = rating_change
        db.commit()
        db.refresh(user)
        db.refresh(submission)

    return {
        "message": "퀴즈 제출 완료",
        "correct_count": correct_count,
        "rating_change": rating_change if mode == "test" else None
    }


# 퀴즈 결과 가져오는 거임
@router.get("/{quiz_id}/result/{user_id}", response_model=QuizResultResponse)
def get_quiz_result(quiz_id: int, user_id: int, db: Session = Depends(get_db)):
    """
    특정 사용자가 제출한 퀴즈 결과 조회 API
    """
    
    print(f"📢 [DEBUG] quiz_id: {quiz_id}, user_id: {user_id}")
    
    # 1️⃣ 퀴즈 정보 조회
    quiz = db.query(Quiz).filter(Quiz.quiz_id == quiz_id).first()
    if not quiz:
        print(f"🚨 [ERROR] 퀴즈 {quiz_id}를 찾을 수 없습니다.")
        raise HTTPException(status_code=404, detail="퀴즈를 찾을 수 없습니다.")

    print(f"✅ [DEBUG] 퀴즈 정보 조회 성공: {quiz}")

    # 2️⃣ 사용자의 제출 정보 조회
    submission = (
        db.query(QuizSubmissions)
        .filter(QuizSubmissions.quiz_id == quiz_id, QuizSubmissions.user_id == user_id)
        .first()
    )
    if not submission:
        print(f"🚨 [ERROR] 사용자 {user_id}의 퀴즈 {quiz_id} 제출 기록이 없습니다.")
        raise HTTPException(status_code=404, detail="제출된 퀴즈 결과를 찾을 수 없습니다.")

    print(f"✅ [DEBUG] 퀴즈 제출 정보 조회 성공: {submission}")

    # 3️⃣ 문제별 정답 비교
    submission_details = (
        db.query(QuizSubmissionDetails)
        .filter(QuizSubmissionDetails.submission_id == submission.submission_id)
        .all()
    )

    if not submission_details:
        print(f"🚨 [ERROR] 제출 ID {submission.submission_id}에 대한 상세 기록이 없습니다.")
        raise HTTPException(status_code=404, detail="퀴즈 제출 상세 정보를 찾을 수 없습니다.")

    print(f"✅ [DEBUG] 제출된 문제 개수: {len(submission_details)}")
    
    question_results = []
    for detail in submission_details:
        question = db.query(Question).filter(Question.question_id == detail.question_id).first()
        if not question:
            print(f"⚠️ [WARNING] 문제 ID {detail.question_id}를 찾을 수 없습니다. (스킵됨)")
            continue  # 문제를 찾을 수 없으면 스킵

        question_results.append({
            "question_id": question.question_id,
            "question_text": question.question_text,
            "user_answer": detail.user_answer,
            "correct_answer": question.correct_answer,  # ✅ 정답 필드 수정
            "is_correct": detail.is_correct
        })
    print(f"✅ [DEBUG] 최종 반환 데이터: {question_results}")
    return {
        "quiz_id": quiz.quiz_id,
        "title": quiz.title,
        "quiz_type": quiz.quiz_type,
        "submitted_at": submission.submitted_at,
        "questions": question_results,
        "rating_change": submission.rating_change if quiz.quiz_type == "test" else None
    }

@router.get("/history/{user_id}")
def get_user_quiz_history(user_id: int, db: Session = Depends(get_db)):
    """
    사용자의 푼 퀴즈 내역 조회 API
    """
    quiz_history = (
        db.query(QuizSubmissions, Quiz)
        .join(Quiz, QuizSubmissions.quiz_id == Quiz.quiz_id)
        .filter(QuizSubmissions.user_id == user_id)
        .order_by(QuizSubmissions.submitted_at.desc())
        .all()
    )

    if not quiz_history:
        return []

    return [
        {
            "quiz_id": submission.quiz_id,
            "title": quiz.title,
            "quiz_type": quiz.quiz_type,
            "correct_count": submission.correct_count,
            "total_questions": db.query(QuizSubmissionDetails)
                                 .filter(QuizSubmissionDetails.submission_id == submission.submission_id)
                                 .count(),
            "submitted_at": submission.submitted_at,
            "rating_change": submission.rating_change 
        }
        for submission, quiz in quiz_history
    ]
