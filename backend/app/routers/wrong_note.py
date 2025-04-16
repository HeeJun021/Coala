from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.coding_tests import WrongNote, CodingTestSubmissions
from app.schemas.coding_tests import WrongNoteCreate, WrongNoteResponse, WrongNoteUpdate
from datetime import datetime
from fastapi import Path

router = APIRouter(
    prefix="/wrong-note",
    tags=["WrongNote"]
)

# ✅ 오답노트 작성 API
@router.post("/create", response_model=WrongNoteResponse)
def create_wrong_note(note_data: WrongNoteCreate, db: Session = Depends(get_db)):
    # 제출이 존재하는지 확인
    submission = db.query(CodingTestSubmissions).filter(
        CodingTestSubmissions.ct_submission_id == note_data.ct_submission_id
    ).first()

    if not submission:
        raise HTTPException(status_code=404, detail="제출을 찾을 수 없습니다.")

    # ✅ 필요 시 제출 제목 수정
    if note_data.note and submission.title is None:
        submission.title = "제출 제목 없음"  # or 기본값 유지

    # ✅ 오답노트 저장
    new_note = WrongNote(
        user_id=note_data.user_id,
        ct_submission_id=note_data.ct_submission_id,
        submitted_answer=note_data.submitted_answer,
        execution_result=note_data.execution_result,
        note=note_data.note,
        created_at=datetime.utcnow()
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)

    return new_note

@router.get("/by-submission/{submission_id}", response_model=WrongNoteResponse)
def get_wrong_note_by_submission(
    submission_id: int = Path(..., description="ct_submission_id"),
    db: Session = Depends(get_db)
):
    note = db.query(WrongNote).filter(WrongNote.ct_submission_id == submission_id).first()

    if not note:
        raise HTTPException(status_code=404, detail="오답노트를 찾을 수 없습니다.")

    submission = db.query(CodingTestSubmissions).filter(
        CodingTestSubmissions.ct_submission_id == submission_id
    ).first()

    # ✅ dict로 응답을 커스터마이징 (title 포함)
    return {
        "note_id": note.note_id,
        "user_id": note.user_id,
        "ct_submission_id": note.ct_submission_id,
        "submitted_answer": note.submitted_answer,
        "execution_result": note.execution_result,
        "note": note.note,
        "created_at": note.created_at,
        "title": submission.title if submission else ""
    }



# ✅ 오답노트 수정 API
@router.patch("/{note_id}", response_model=WrongNoteResponse)
def update_wrong_note(
    note_id: int,
    data: WrongNoteUpdate,
    db: Session = Depends(get_db)
):
    note = db.query(WrongNote).filter(WrongNote.note_id == note_id).first()

    if not note:
        raise HTTPException(status_code=404, detail="오답노트를 찾을 수 없습니다.")

    # 오답 내용 수정
    if data.note is not None:
        note.note = data.note

    # 제출 제목도 함께 수정 가능
    if data.title is not None:
        submission = db.query(CodingTestSubmissions).filter(
            CodingTestSubmissions.ct_submission_id == note.ct_submission_id
        ).first()
        if submission:
            submission.title = data.title

    db.commit()
    db.refresh(note)

    return note