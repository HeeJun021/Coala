from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user_quiz import Userquizzes, Userquestions, Userquizassignments, Userquizsubmissions, Userquizsubmissiondetails
from app.schemas.user_quiz import UserQuizCreate, UserQuizCreateResponse, UserQuizDetail, UserQuestionDetail, UserQuizSubmitRequest, UserQuizSubmitResponse, UserQuizResultResponse
from app.services.user_quiz_service import create_user_quiz, get_all_user_quizzes, get_user_quiz_result_service
from sqlalchemy.orm import Session

router = APIRouter(prefix="/user-quiz", tags=["User Quiz"])

@router.post("/create", response_model=UserQuizCreateResponse)
def create_user_quiz_endpoint(
    quiz_data: UserQuizCreate,
    db: Session = Depends(get_db)
):
    result = create_user_quiz(quiz_data, db)
    return result

@router.get("/all")
def get_all_user_quizzes_endpoint(
    search: str = Query(None, description="사용자 이름 검색"),
    db: Session = Depends(get_db)
):
    return get_all_user_quizzes(db, search)

@router.get("/{userquiz_id}", response_model=UserQuizDetail)
def get_user_quiz_detail(userquiz_id: int, db: Session = Depends(get_db)):
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
                question_type=q.question_type,  # 🔥 실제 DB 값 사용
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
    

@router.post("/submit", response_model=UserQuizSubmitResponse)
def submit_user_quiz(data: UserQuizSubmitRequest, db: Session = Depends(get_db)):
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
                uq_submission_id=None,  # 나중에 넣음
                seq=seq + 1,
                question_text=q.question_text,
                user_answer=user_answer,
                correct_answer=q.correct_answer,
                is_correct=is_correct,
            )
        )

    # 제출 기록 저장
    submission = Userquizsubmissions(
        userquiz_id=data.userquiz_id,
        user_id=data.user_id,
        correct_count=correct_count
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    # 세부 내역 저장
    for d in details:
        d.uq_submission_id = submission.uq_submission_id
        db.add(d)

    db.commit()

    return UserQuizSubmitResponse(
        uq_submission_id=submission.uq_submission_id,
        correct_count=correct_count,
        total_count=len(assignments),
    )
    
@router.get("/result/{uq_submission_id}", response_model=UserQuizResultResponse)
def get_user_quiz_result(uq_submission_id: int, db: Session = Depends(get_db)):
    return get_user_quiz_result_service(uq_submission_id, db)