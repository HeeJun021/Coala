from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.models.question_models import Question
from app.schemas.question_schema import QuestionCreate, QuestionResponse

def get_all_questions(db: Session):
    return db.query(Question).all()

def get_random_questions(db: Session, count: int, types: list, difficulty: int, language_id: int):
    query = db.query(Question)
    if types:
        query = query.filter(Question.question_type.in_(types))
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    if language_id:
        query = query.filter(Question.language_id == language_id)    
    
    return query.order_by(func.random()).limit(count).all()

def get_question_by_id(db: Session, question_id: int):
    return db.query(Question).filter(Question.question_id == question_id).first()

def create_question(db: Session, question_data: QuestionCreate) -> Question:
    """
    새로운 문제 생성
    """
    new_question = Question(
        question_text=question_data.question_text,
        choices=question_data.choices,
        question_type=question_data.question_type,
        difficulty=question_data.difficulty,
        correct_answer=question_data.correct_answer,
        explanation=question_data.explanation,
        language_id=question_data.language_id,
    )
    db.add(new_question)
    db.commit()
    db.refresh(new_question)
    return new_question

def delete_question(db: Session, question_id: int) -> bool:
    """
    특정 문제 삭제
    """
    question = db.query(Question).filter(Question.question_id == question_id).first()
    if question:
        db.delete(question)
        db.commit()
        return True
    return False
