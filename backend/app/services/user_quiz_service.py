from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.orm import aliased
from fastapi import HTTPException

from app.models.user_quiz_models import (
    Userquizzes,
    Userquestions,
    Userquizassignments,
    Userquizsubmissions,
    Userquizsubmissiondetails,
)
from app.models.user import User
from app.schemas.user_quiz_schema import (
    UserQuizCreate,
    UserQuizCreateResponse,
    UserQuizDetail,
    UserQuestionDetail,
    UserQuizSubmitRequest,
    UserQuizSubmitResponse,
    UserQuizResultResponse,
    UserQuizResultQuestion,
    UserQuizHistoryResponse,
    UserQuizHistoryItem,
)


def create_user_quiz(quiz_data: UserQuizCreate, db: Session) -> UserQuizCreateResponse:
    new_quiz = Userquizzes(
        user_id=quiz_data.user_id,
        title=quiz_data.title,
        content=quiz_data.content
    )
    db.add(new_quiz)
    db.flush()

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
        db.flush()

        assignment = Userquizassignments(
            userquiz_id=new_quiz.userquiz_id,
            seq=idx,
            userquestion_id=new_question.userquestion_id
        )
        db.add(assignment)
        question_ids.append(new_question.userquestion_id)

    db.commit()

    return UserQuizCreateResponse(
        userquiz_id=new_quiz.userquiz_id,
        question_ids=question_ids
    )


def get_all_user_quizzes(db: Session, search: str = None, user_id: int = None):
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
        query = query.filter(Userquizzes.title.ilike(f"%{search}%"))
    if user_id:
        query = query.filter(User.user_id == user_id)

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


def get_user_quiz_detail(userquiz_id: int, db: Session) -> UserQuizDetail:
    quiz = db.query(Userquizzes).filter(Userquizzes.userquiz_id == userquiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="퀴즈를 찾을 수 없습니다.")

    assignments = db.query(Userquizassignments).filter(
        Userquizassignments.userquiz_id == userquiz_id
    ).order_by(Userquizassignments.seq).all()

    question_ids = [a.userquestion_id for a in assignments]

    questions = db.query(Userquestions).filter(
        Userquestions.userquestion_id.in_(question_ids)
    ).all()

    question_details = []
    for q in questions:
        question_details.append(
            UserQuestionDetail(
                userquestion_id=q.userquestion_id,
                question_text=q.question_text,
                question_type=q.question_type,
                choices=q.choices,
                explanation=q.explanation,
            )
        )

    return UserQuizDetail(
        userquiz_id=quiz.userquiz_id,
        title=quiz.title,
        content=quiz.content,
        questions=question_details,
    )


def submit_user_quiz(data: UserQuizSubmitRequest, db: Session) -> UserQuizSubmitResponse:
    quiz = db.query(Userquizzes).filter(Userquizzes.userquiz_id == data.userquiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="퀴즈를 찾을 수 없습니다.")

    assignments = db.query(Userquizassignments).filter(
        Userquizassignments.userquiz_id == data.userquiz_id
    ).order_by(Userquizassignments.seq).all()

    question_ids = [a.userquestion_id for a in assignments]
    questions = db.query(Userquestions).filter(
        Userquestions.userquestion_id.in_(question_ids)
    ).all()

    correct_count = 0
    details = []

    for seq, assignment in enumerate(assignments):
        q = next((q for q in questions if q.userquestion_id == assignment.userquestion_id), None)
        if not q:
            continue
        user_answer = next(
            (a["user_answer"] for a in data.answers if a["question_id"] == q.userquestion_id), ""
        )
        is_correct = str(user_answer).strip() == str(q.correct_answer).strip()
        if is_correct:
            correct_count += 1

        details.append(
            Userquizsubmissiondetails(
                uq_submission_id=None,
                seq=seq + 1,
                question_text=q.question_text,
                user_answer=user_answer,
                correct_answer=q.correct_answer,
                is_correct=is_correct
            )
        )

    submission = Userquizsubmissions(
        userquiz_id=data.userquiz_id,
        user_id=data.user_id,
        correct_count=correct_count
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    for d in details:
        d.uq_submission_id = submission.uq_submission_id
        db.add(d)

    db.commit()

    return UserQuizSubmitResponse(
        uq_submission_id=submission.uq_submission_id,
        correct_count=correct_count,
        total_count=len(assignments),
    )


def get_user_quiz_result_service(uq_submission_id: int, db: Session) -> UserQuizResultResponse:
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

    # 서브미션 디테일 (question_text 기준으로만 저장됨)
    details = db.query(Userquizsubmissiondetails).filter(
        Userquizsubmissiondetails.uq_submission_id == uq_submission_id
    ).order_by(Userquizsubmissiondetails.seq).all()

    # 질문 전체 불러와서 question_text 기준 매핑
    questions = db.query(Userquestions).all()
    question_map = {q.question_text: q for q in questions}

    questions_response = []
    for d in details:
        match_question = question_map.get(d.question_text)

        questions_response.append(
            UserQuizResultQuestion(
                question_text=d.question_text,
                user_answer=d.user_answer,
                correct_answer=d.correct_answer,
                is_correct=d.is_correct,
                explanation=match_question.explanation if match_question else "",
                question_type=match_question.question_type if match_question else 1
            )
        )

    return UserQuizResultResponse(
        userquiz_id=submission.userquiz_id,
        title=quiz.title,
        submitted_at=submission.submitted_at,
        correct_count=submission.correct_count,
        questions=questions_response
    )


def get_user_quiz_history(db: Session, user_id: int) -> UserQuizHistoryResponse:
    # alias를 써서 "quiz_creator"라는 가상의 모델명으로 JOIN
    quiz_creator = aliased(User)

    results = (
        db.query(
            Userquizsubmissions.uq_submission_id,
            Userquizsubmissions.userquiz_id,
            Userquizzes.title,
            Userquizsubmissions.correct_count,
            Userquizsubmissions.submitted_at,
            quiz_creator.nickname.label("creator_name")  # ← 제대로 된 creator
        )
        # 1) 제출 정보와 퀴즈를 JOIN
        .join(Userquizzes, Userquizsubmissions.userquiz_id == Userquizzes.userquiz_id)
        # 2) 퀴즈와 "퀴즈 만든 사람"을 JOIN
        .join(quiz_creator, Userquizzes.user_id == quiz_creator.user_id)
        # 3) 이 "제출"의 주인은 user_id
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