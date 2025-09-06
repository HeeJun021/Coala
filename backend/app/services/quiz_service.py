from fastapi import HTTPException
from typing import List, Optional
from sqlalchemy import case
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.models.quiz_models import Quiz, QuizSetting, QuizAssignment, QuizSubmissions, QuizSubmissionDetails
from app.schemas.quiz_schema import QuizResponse, QuizSubmissionRequest
from app.schemas.question_schema import QuestionResponse
from app.models.question_models import Question
from app.models.user import User
from app.utils.quiz import check_answer 
from app.services.user import reward_user_by_action
from app.schemas.eucalyptus_schema import RewardActionType
from app.models.language import Language

def get_all_quizzes(db: Session):
    return db.query(Quiz).all()

def get_quiz(db: Session, quiz_id: int):
    try:
        quiz = db.query(Quiz).filter(Quiz.quiz_id == quiz_id).first()
        if not quiz:
            return None

        #   퀴즈에 포함된 문제 리스트 가져오기
        assignments = db.query(QuizAssignment).filter(QuizAssignment.quiz_id == quiz_id).all()
        question_ids = [a.question_id for a in assignments]
        print(f"  퀴즈 {quiz_id}의 문제 배정: {question_ids}") 
        questions = db.query(Question).filter(Question.question_id.in_(question_ids)).all()
        print(f"  가져온 문제 개수: {len(questions)}")

        #   JSON 응답에 문제 목록을 포함하여 반환
        return QuizResponse(
            quiz_id=quiz.quiz_id,
            title=quiz.title,
            quiz_type=quiz.quiz_type,
            language_id=quiz.language_id,  
            created_at=quiz.created_at,
            questions=[
                QuestionResponse(
                    question_id=q.question_id,
                    question_text=q.question_text,
                    question_type=q.question_type,
                    difficulty=q.difficulty,
                    correct_answer=q.correct_answer,
                    explanation=q.explanation,
                    choices=q.choices if q.choices else None,
                    language_id=q.language_id,
                    created_at=q.created_at,
                    updated_at=q.updated_at,
                )
                for q in questions
            ]
        )
    except Exception as e:
        print(f"  퀴즈 조회 중 오류 발생: {e}")
        return None



def create_quiz(db: Session, title: str, quiz_type: str, language_id:int, settings: list):
    # 퀴즈 생성
    new_quiz = Quiz(title=title, quiz_type=quiz_type, language_id=language_id)
    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)

    # 퀴즈 설정 저장
    for setting in settings:
        new_setting = QuizSetting(
            quiz_id=new_quiz.quiz_id,
            question_type=setting["question_type"],
            difficulty=setting["difficulty"],
            question_count=setting["question_count"]
        )
        db.add(new_setting)
    db.commit()

    # 문제 배정
    all_selected_questions = []  # 문제 배정 확인을 위한 리스트 추가
    for setting in settings:
        selected_questions = db.query(Question).filter(
            Question.question_type == setting["question_type"],
            Question.difficulty == setting["difficulty"],
            Question.language_id == language_id
        ).order_by(func.random()).limit(setting["question_count"]).all()

        print(f"선택된 문제 목록 ({setting['question_type']}, 난이도 {setting['difficulty']}): {[q.question_id for q in selected_questions]}")  # ✅ 디버깅 로그 추가
        all_selected_questions.extend(selected_questions)  # 문제 추가

        for question in selected_questions:
            new_assignment = QuizAssignment(
                quiz_id=new_quiz.quiz_id,
                question_id=question.question_id
            )
            db.add(new_assignment)

    db.commit()

    # 문제 배정이 정상적으로 되었는지 확인
    if not all_selected_questions:
        print("퀴즈에 배정된 문제가 없습니다! QuizAssignment가 정상적으로 이루어졌는지 확인하세요.")
        return None

    return new_quiz

def calculate_language_balanced_rating(user_id: int, language_id: int, base_rating: int, db: Session) -> int:
    """
    사용자의 언어별 퀴즈 풀이 편중도에 따라 보정된 점수 반환
    """
    result = db.execute(
        """
        SELECT q.language_id, COUNT(*) as cnt
        FROM quizsubmissions qs
        JOIN quizzes q ON qs.quiz_id = q.quiz_id
        WHERE qs.user_id = :user_id
        GROUP BY q.language_id;
        """,
        {"user_id": user_id}
    ).fetchall()

    if not result:
        return base_rating

    lang_counts = {row.language_id: row.cnt for row in result}
    current_count = lang_counts.get(language_id, 0)
    max_count = max(lang_counts.values())
    imbalance_ratio = current_count / max_count if max_count else 1.0

    adjusted_rating = int(base_rating * (1 - 0.5 * imbalance_ratio))
    return max(5, adjusted_rating)

def submit_quiz_logic(submission_data: QuizSubmissionRequest, db: Session):
    user_id = submission_data.user_id
    quiz_id = submission_data.quiz_id
    mode = submission_data.mode
    user_answers = submission_data.answers

    quiz = db.query(Quiz).filter(Quiz.quiz_id == quiz_id).first()
    if not quiz:
        raise Exception("퀴즈를 찾을 수 없습니다.")

    # 퀴즈 제출 생성
    submission = QuizSubmissions(
        quiz_id=quiz_id,
        user_id=user_id,
        correct_count=0,
        rating_change=0
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    correct_count = 0
    submission_details = []

    for answer in user_answers:
        question = db.query(Question).filter(Question.question_id == answer.question_id).first()
        if not question:
            continue

        is_correct = check_answer(question, answer.user_answer) or False
        if is_correct:
            correct_count += 1

        submission_details.append(QuizSubmissionDetails(
            submission_id=submission.submission_id,
            question_id=question.question_id,
            user_answer=answer.user_answer,
            is_correct=is_correct
        ))

    if not submission_details:
        db.delete(submission)
        db.commit()
        return {"message": "퀴즈가 제출되지 않았습니다. 다시 풀어주세요."}

    db.add_all(submission_details)
    submission.correct_count = correct_count
    db.commit()

    # 테스트 모드일 경우 점수 계산
    rating_change = 0
    if mode == "test":
        correct_rate = correct_count / len(user_answers)
        if correct_rate >= 1.0:
            base = 50
        elif correct_rate >= 0.75:
            base = 25
        elif correct_rate < 0.3:
            base = -30
        else:
            base = 0

        if base > 0:
            rating_change = calculate_language_balanced_rating(user_id, quiz.language_id, base, db)
        else:
            rating_change = base

        user = db.query(User).filter(User.user_id == user_id).first()
        user.rating += rating_change
        submission.rating_change = rating_change
        db.commit()

        try:
            reward_user_by_action(user, RewardActionType.quiz_correct, db)
            print("유칼립투스 보상 지급 완료 (테스트 모드)")
        except Exception as e:
            print(f"보상 지급 실패: {str(e)}")

    return {
        "message": "퀴즈 제출 완료",
        "correct_count": correct_count,
        "rating_change": rating_change if mode == "test" else None
    }
    
def get_quiz_result_service(quiz_id: int, user_id: int, db: Session):
    quiz = db.query(Quiz).filter(Quiz.quiz_id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="퀴즈를 찾을 수 없습니다.")

    submission = (
        db.query(QuizSubmissions)
        .filter(QuizSubmissions.quiz_id == quiz_id, QuizSubmissions.user_id == user_id)
        .first()
    )
    if not submission:
        raise HTTPException(status_code=404, detail="제출된 퀴즈 결과를 찾을 수 없습니다.")

    submission_details = (
        db.query(QuizSubmissionDetails)
        .filter(QuizSubmissionDetails.submission_id == submission.submission_id)
        .all()
    )
    if not submission_details:
        raise HTTPException(status_code=404, detail="퀴즈 제출 상세 정보를 찾을 수 없습니다.")

    question_results = []
    for detail in submission_details:
        question = db.query(Question).filter(Question.question_id == detail.question_id).first()
        if not question:
            continue
        question_results.append({
            "question_id": question.question_id,
            "question_text": question.question_text,
            "user_answer": detail.user_answer,
            "correct_answer": question.correct_answer,
            "is_correct": detail.is_correct,
            "explanation": question.explanation or ""
        })

    return {
        "quiz_id": quiz.quiz_id,
        "title": quiz.title,
        "quiz_type": quiz.quiz_type,
        "submitted_at": submission.submitted_at,
        "questions": question_results,
        "rating_change": submission.rating_change if quiz.quiz_type == "test" else None
    }
    
def get_user_quiz_history_service(user_id: int, db: Session):
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
            "language_id": quiz.language_id,
            "language_name": quiz.language.language,
            "correct_count": submission.correct_count,
            "total_questions": db.query(QuizSubmissionDetails)
                                 .filter(QuizSubmissionDetails.submission_id == submission.submission_id)
                                 .count(),
            "submitted_at": submission.submitted_at,
            "rating_change": submission.rating_change 
        }
        for submission, quiz in quiz_history
    ]
    
def get_quiz_statistics(user_id: int, db: Session):
    # 전체 제출 수 (테스트 퀴즈만)
    total_submissions = (
        db.query(QuizSubmissions)
        .join(Quiz, QuizSubmissions.quiz_id == Quiz.quiz_id)
        .filter(QuizSubmissions.user_id == user_id, Quiz.quiz_type == "test")
        .count()
    )

    # 전체 정답 수 (디테일 기준)
    correct_submissions = (
        db.query(func.count(QuizSubmissionDetails.detail_id))
        .join(QuizSubmissions, QuizSubmissionDetails.submission_id == QuizSubmissions.submission_id)
        .join(Quiz, QuizSubmissions.quiz_id == Quiz.quiz_id)
        .filter(
            QuizSubmissions.user_id == user_id,
            Quiz.quiz_type == "test",
            QuizSubmissionDetails.is_correct == True
        )
        .scalar()
    )

    # 전체 문제 수 (퀴즈 디테일 기준)
    total_questions = (
        db.query(func.count(QuizSubmissionDetails.detail_id))
        .join(QuizSubmissions, QuizSubmissionDetails.submission_id == QuizSubmissions.submission_id)
        .join(Quiz, QuizSubmissions.quiz_id == Quiz.quiz_id)
        .filter(
            QuizSubmissions.user_id == user_id,
            Quiz.quiz_type == "test"
        )
        .scalar()
    )

    accuracy = (
        (correct_submissions / total_questions * 100)
        if total_questions > 0 else 0.0
    )

    # 언어별 제출 수 및 정답 수 (정확하게 디테일 기준으로 집계)
    language_stats = (
        db.query(
            Language.language_id,
            Language.language,
            func.count(QuizSubmissionDetails.detail_id).label("total"),
            func.sum(case((QuizSubmissionDetails.is_correct == True, 1), else_=0)).label("correct")
        )
        .join(Question, Question.question_id == QuizSubmissionDetails.question_id)
        .join(QuizSubmissions, QuizSubmissionDetails.submission_id == QuizSubmissions.submission_id)
        .join(Quiz, QuizSubmissions.quiz_id == Quiz.quiz_id)
        .join(Language, Quiz.language_id == Language.language_id)
        .filter(
            QuizSubmissions.user_id == user_id,
            Quiz.quiz_type == "test"
        )
        .group_by(Language.language_id, Language.language)
        .all()
    )

    solved_by_language = []
    for lang_id, lang_name, total, correct in language_stats:
        acc = (correct / total * 100) if total else 0.0
        solved_by_language.append({
            "language_id": lang_id,
            "language_name": lang_name,
            "submissions": total,
            "correct": correct,
            "accuracy": round(acc, 1)
        })

    return {
        "totalSubmissions": total_submissions,
        "correctSubmissions": correct_submissions,
        "accuracy": round(accuracy, 1),
        "solvedByLanguage": solved_by_language
    }
    
def get_user_incorrect_questions_service(user_id: int, db: Session, language_id: Optional[int] = None):
    """
    사용자가 틀렸던 모든 문제와 틀린 횟수를 집계하여 반환합니다.
    language_id가 주어지면 해당 언어의 문제만 필터링합니다.
    """
    
    # 기본 쿼리 구성
    query = (
        db.query(
            Question,
            func.count(Question.question_id).label("incorrect_attempts")
        )
        .join(QuizSubmissionDetails, Question.question_id == QuizSubmissionDetails.question_id)
        .join(QuizSubmissions, QuizSubmissionDetails.submission_id == QuizSubmissions.submission_id)
        .filter(
            QuizSubmissions.user_id == user_id,
            QuizSubmissionDetails.is_correct == False
        )
    )

    # language_id가 파라미터로 들어온 경우, 필터 조건 추가
    if language_id is not None:
        query = query.filter(Question.language_id == language_id)

    # 그룹화 및 정렬
    incorrect_questions_with_count = (
        query.group_by(Question.question_id)
        .order_by(func.count(Question.question_id).desc())
        .all()
    )

    if not incorrect_questions_with_count:
        return []

    results = []
    for question, attempts in incorrect_questions_with_count:
        results.append({
            "question_id": question.question_id,
            "question_text": question.question_text,
            "question_type": question.question_type,
            "difficulty": question.difficulty,
            "correct_answer": question.correct_answer,
            "explanation": question.explanation,
            "choices": question.choices,
            "language_id": question.language_id,
            "incorrect_attempts": attempts,
            "created_at": question.created_at,
            "updated_at": question.updated_at
        })

    return results

def create_quiz_from_questions(db: Session, title: str, quiz_type: str, language_id: int, question_ids: List[int]):
    """
    제공된 문제 ID 목록으로 새로운 퀴즈를 생성합니다.
    """
    # 1. 새로운 퀴즈 생성
    new_quiz = Quiz(title=title, quiz_type=quiz_type, language_id=language_id)
    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)

    # 2. 제공된 문제 ID들을 퀴즈에 배정 (QuizAssignment)
    assignments = []
    for q_id in question_ids:
        # 실제 존재하는 문제인지 확인하는 로직을 추가하면 더 안정적
        assignments.append(QuizAssignment(quiz_id=new_quiz.quiz_id, question_id=q_id))
    
    db.add_all(assignments)
    db.commit()

    # 3. 생성된 퀴즈 정보 반환
    # (get_quiz 서비스를 호출하여 전체 퀴즈 정보를 반환하는 것이 더 좋음)
    return get_quiz(db, new_quiz.quiz_id)

def create_retake_quiz_service(db: Session, user_id: int, title: str, language_id: int, count: int):
    """
    사용자의 오답 문제를 기반으로 새로운 복습 퀴즈를 생성합니다.
    가장 많이 틀린 순서대로 'count' 개수만큼 문제를 선택합니다.
    """
    # 1. 사용자의 전체 오답 목록을 가져온다 (이미 가장 많이 틀린 순으로 정렬되어 있음).
    all_incorrect_questions = get_user_incorrect_questions_service(user_id=user_id, db=db)
    
    if not all_incorrect_questions:
        # 틀린 문제가 없으면 퀴즈를 생성할 수 없음
        return None

    # 2. 요청된 개수(count)만큼 문제 목록을 잘라낸다.
    questions_for_quiz = all_incorrect_questions[:count]
    
    # 3. 잘라낸 문제들의 ID만 추출한다.
    question_ids = [q["question_id"] for q in questions_for_quiz]

    if not question_ids:
        return None

    # 4. 추출된 ID들로 '임시 퀴즈' 생성을 요청한다 (기존 함수 재사용).
    return create_quiz_from_questions(
        db=db,
        title=title,
        quiz_type="practice", # 오답 퀴즈는 'practice' 타입으로 고정
        language_id=language_id,
        question_ids=question_ids
    )