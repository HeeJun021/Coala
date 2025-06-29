from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.models.quiz_models import Quiz, QuizSetting, QuizAssignment
from app.schemas.quiz_schema import QuizResponse
from app.schemas.question_schema import QuestionResponse
from app.models.question_models import Question
from app.utils.quiz import check_answer 
from app.services.user import reward_user_by_action
from app.schemas.eucalyptus_schema import RewardActionType

def get_all_quizzes(db: Session):
    return db.query(Quiz).all()

def get_quiz(db: Session, quiz_id: int):
    try:
        quiz = db.query(Quiz).filter(Quiz.quiz_id == quiz_id).first()
        if not quiz:
            return None

        # ✅ 퀴즈에 포함된 문제 리스트 가져오기
        assignments = db.query(QuizAssignment).filter(QuizAssignment.quiz_id == quiz_id).all()
        question_ids = [a.question_id for a in assignments]
        print(f"📌 퀴즈 {quiz_id}의 문제 배정: {question_ids}") 
        questions = db.query(Question).filter(Question.question_id.in_(question_ids)).all()
        print(f"📌 가져온 문제 개수: {len(questions)}")

        # ✅ JSON 응답에 문제 목록을 포함하여 반환
        return QuizResponse(
            quiz_id=quiz.quiz_id,
            title=quiz.title,
            quiz_type=quiz.quiz_type,
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
                    created_at=q.created_at,
                    updated_at=q.updated_at,
                )
                for q in questions
            ]
        )
    except Exception as e:
        print(f"🚨 퀴즈 조회 중 오류 발생: {e}")
        return None



def create_quiz(db: Session, title: str, quiz_type: str, settings: list):
    # 1️⃣ 퀴즈 생성
    new_quiz = Quiz(title=title, quiz_type=quiz_type)
    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)

    # 2️⃣ 퀴즈 설정 저장
    for setting in settings:
        new_setting = QuizSetting(
            quiz_id=new_quiz.quiz_id,
            question_type=setting["question_type"],
            difficulty=setting["difficulty"],
            question_count=setting["question_count"]
        )
        db.add(new_setting)
    db.commit()

    # 3️⃣ 문제 배정
    all_selected_questions = []  # ✅ 문제 배정 확인을 위한 리스트 추가
    for setting in settings:
        selected_questions = db.query(Question).filter(
            Question.question_type == setting["question_type"],
            Question.difficulty == setting["difficulty"]
        ).order_by(func.random()).limit(setting["question_count"]).all()

        print(f"📌 선택된 문제 목록 ({setting['question_type']}, 난이도 {setting['difficulty']}): {[q.question_id for q in selected_questions]}")  # ✅ 디버깅 로그 추가
        all_selected_questions.extend(selected_questions)  # 문제 추가

        for question in selected_questions:
            new_assignment = QuizAssignment(
                quiz_id=new_quiz.quiz_id,
                question_id=question.question_id
            )
            db.add(new_assignment)

    db.commit()

    # ✅ 문제 배정이 정상적으로 되었는지 확인
    if not all_selected_questions:
        print("🚨 퀴즈에 배정된 문제가 없습니다! QuizAssignment가 정상적으로 이루어졌는지 확인하세요.")
        return None

    return new_quiz

