from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.models.question import Question

def get_all_questions(db: Session):
    return db.query(Question).all()

def get_random_questions(db: Session, count: int, types: list, difficulty: int):
    query = db.query(Question)
    if types:
        query = query.filter(Question.question_type.in_(types))
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    return query.order_by(func.random()).limit(count).all()

def get_question_by_id(db: Session, question_id: int):
    return db.query(Question).filter(Question.question_id == question_id).first()
