from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.user_quiz import Userquizzes, Userquestions, Userquizassignments, Userquizsubmissions, Userquizsubmissiondetails
from app.models.user import User
from app.schemas.user_quiz import UserQuizCreate, UserQuizResultResponse, UserQuizResultQuestion, UserQuizHistoryResponse, UserQuizHistoryItem


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
            categories=q.categories,
            question_type=q.question_type
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

from sqlalchemy import func
from app.models.user_quiz import Userquizzes, Userquizsubmissions
from app.models.user import User

def get_all_user_quizzes(db: Session, search: str = None):
    query = (
        db.query(
            Userquizzes,
            User.nickname,
            func.count(Userquizsubmissions.uq_submission_id).label("submission_count")
        )
        .join(User, Userquizzes.user_id == User.user_id)
        .outerjoin(Userquizsubmissions, Userquizzes.userquiz_id == Userquizsubmissions.userquiz_id)
        .group_by(Userquizzes.userquiz_id, User.nickname)
        .order_by(Userquizzes.created_at.desc())
    )

    if search:
        query = query.filter(User.nickname.ilike(f"%{search}%"))

    results = query.all()

    quizzes = []
    for quiz, nickname, submission_count in results:
        quizzes.append({
            "userquiz_id": quiz.userquiz_id,
            "title": quiz.title,
            "content": quiz.content,
            "created_at": quiz.created_at,
            "nickname": nickname,
            "submission_count": submission_count
        })

    return quizzes

def get_user_quiz_result_service(uq_submission_id: int, db: Session):
    submission = db.query(Userquizsubmissions).filter(
        Userquizsubmissions.uq_submission_id == uq_submission_id
    ).first()

    if not submission:
        raise HTTPException(status_code=404, detail="제출 내역을 찾을 수 없습니다.")

    quiz = db.query(Userquizzes).filter(
        Userquizzes.userquiz_id == submission.userquiz_id
    ).first()

    if not quiz:
        raise HTTPException(status_code=404, detail="퀴즈 정보를 찾을 수 없습니다.")

    details = db.query(Userquizsubmissiondetails).filter(
        Userquizsubmissiondetails.uq_submission_id == uq_submission_id
    ).order_by(Userquizsubmissiondetails.seq).all()

    questions = []
    for d in details:
        questions.append(
            UserQuizResultQuestion(
                question_text=d.question_text,
                user_answer=d.user_answer,
                correct_answer=d.correct_answer,
                is_correct=d.is_correct,
                explanation=d.explanation if hasattr(d, "explanation") else "",  # 없으면 빈값
                question_type=d.question_type if hasattr(d, "question_type") else 1  # 없으면 OX
            )
        )

    return UserQuizResultResponse(
        userquiz_id=submission.userquiz_id,
        title=quiz.title,
        submitted_at=submission.submitted_at,
        correct_count=submission.correct_count,
        questions=questions
    )
    
def get_user_quiz_history(db: Session, user_id: int) -> UserQuizHistoryResponse:
    results = (
        db.query(
            Userquizsubmissions.uq_submission_id,
            Userquizsubmissions.userquiz_id,
            Userquizzes.title,
            Userquizsubmissions.correct_count,
            Userquizsubmissions.submitted_at,
            User.nickname.label("creator_name")
        )
        .join(Userquizzes, Userquizsubmissions.userquiz_id == Userquizzes.userquiz_id)
        .filter(Userquizsubmissions.user_id == user_id)
        .order_by(Userquizsubmissions.submitted_at.desc())
        .all()
    )

    quizzes = [
        UserQuizHistoryItem(
            uq_submission_id=row.uq_submission_id,
            userquiz_id=row.userquiz_id,
            title=row.title,
            correct_count=row.correct_count,
            submitted_at=row.submitted_at,
             creator_name=row.creator_name
        )
        for row in results
    ]

    return UserQuizHistoryResponse(quizzes=quizzes)    

