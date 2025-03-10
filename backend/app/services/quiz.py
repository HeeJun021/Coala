from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.models.quiz import Quiz, QuizSetting, QuizAssignment
from app.models.question import Question

def get_all_quizzes(db: Session):
    return db.query(Quiz).all()

def get_quiz(quiz_id: int, db: Session):
    return db.query(Quiz).filter(Quiz.quiz_id == quiz_id).first()

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
    for setting in settings:
        selected_questions = db.query(Question).filter(
            Question.question_type == setting["question_type"],
            Question.difficulty == setting["difficulty"]
        ).order_by(func.random()).limit(setting["question_count"]).all()

        for question in selected_questions:
            new_assignment = QuizAssignment(
                quiz_id=new_quiz.quiz_id,
                question_id=question.question_id
            )
            db.add(new_assignment)
    db.commit()

    return new_quiz
