from sqlalchemy.orm import Session
from app.models.user_quiz import Userquizzes, Userquestions, Userquizassignments
from app.schemas.user_quiz import UserQuizCreate

def create_user_quiz(quiz_data: UserQuizCreate, db: Session):
    new_quiz = Userquizzes(
        user_id=quiz_data.user_id,
        title=quiz_data.title,
        content=quiz_data.content
    )
    db.add(new_quiz)
    db.flush()  # await 제거

    question_ids = []

    for idx, q in enumerate(quiz_data.questions, start=1):
        new_question = Userquestions(
            user_id=quiz_data.user_id,
            question_text=q.question_text,
            choices=q.choices,
            correct_answer=q.correct_answer,
            explanation=q.explanation,
            categories=q.categories
        )
        db.add(new_question)
        db.flush()  # await 제거

        assignment = Userquizassignments(
            userquiz_id=new_quiz.userquiz_id,
            seq=idx,
            userquestion_id=new_question.userquestion_id
        )
        db.add(assignment)
        question_ids.append(new_question.userquestion_id)

    db.commit()

    return {
        "userquiz_id": new_quiz.userquiz_id,
        "question_ids": question_ids
    }
