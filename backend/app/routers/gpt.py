from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.gpt_models import GptSession, GptMessage
from app.models.user import User
from app.schemas.gpt_schema import (
    GptSessionCreate,
    GptMessageCreate,
    GptMessageResponse,
    GptSingleResponse,
    GptSessionListItem,
    GptSessionDetail,
    GptSessionUpdateTitle,
)
from app.dependencies.auth import get_current_user

from openai import OpenAI
import os

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# ✅ 1. 새 세션 + 첫 질문
@router.post("/sessions/new", response_model=GptSingleResponse)
def create_gpt_session(
    request: GptSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = GptSession(
        user_id=current_user.user_id,
        context=request.context,
        title=request.message[:30],
    )
    db.add(session)
    db.flush()

    user_msg = GptMessage(
        session_id=session.session_id,
        sender_type="user",
        content=request.message,
    )
    db.add(user_msg)

    messages = [
        {"role": "system", "content": f"페이지 컨텍스트: {request.context}"},
        {"role": "user", "content": request.message},
    ]

    try:
        gpt_response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
        )
        answer = gpt_response.choices[0].message.content
    except Exception as e:
        print("❌ GPT 예외 발생:", e)
        raise HTTPException(status_code=500, detail=f"GPT 응답 실패: {e}")

    gpt_msg = GptMessage(
        session_id=session.session_id,
        sender_type="assistant",
        content=answer,
    )
    db.add(gpt_msg)
    db.commit()

    return {"session_id": session.session_id, "response": answer}  # ✅ 추가


# ✅ 2. 기존 세션에 이어서 질문하기
@router.post("/sessions/{session_id}/message", response_model=GptSingleResponse)
def continue_gpt_session(
    session_id: int,
    request: GptMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(GptSession).filter_by(session_id=session_id).first()
    if not session or session.user_id != current_user.user_id:
        raise HTTPException(
            status_code=404, detail="세션이 없거나 접근 권한이 없습니다."
        )

    message_objs = (
        db.query(GptMessage)
        .filter_by(session_id=session_id)
        .order_by(GptMessage.created_at)
        .all()
    )

    messages = [
        {"role": "system", "content": f"페이지 컨텍스트: {session.context}"},
        *[{"role": msg.sender_type, "content": msg.content} for msg in message_objs],
        {"role": "user", "content": request.message},
    ]

    user_msg = GptMessage(
        session_id=session_id,
        sender_type="user",
        content=request.message,
    )
    db.add(user_msg)

    try:
        gpt_response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
        )
        answer = gpt_response.choices[0].message.content
    except Exception as e:
        print("❌ GPT 예외 발생:", e)
        raise HTTPException(status_code=500, detail=f"GPT 응답 실패: {e}")

    gpt_msg = GptMessage(
        session_id=session_id,
        sender_type="assistant",
        content=answer,
    )
    db.add(gpt_msg)

    session.updated_at = db.execute(text("SELECT CURRENT_TIMESTAMP")).scalar()
    db.commit()

    return {"session_id": session.session_id, "response": answer}  # ✅ 반드시 포함


# ✅ 3. GPT 세션 목록 조회
@router.get("/sessions", response_model=List[GptSessionListItem])
def list_gpt_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sessions = (
        db.query(GptSession)
        .filter_by(user_id=current_user.user_id)
        .order_by(GptSession.updated_at.desc())
        .all()
    )
    return sessions


# ✅ 4. GPT 세션 상세 조회
@router.get("/sessions/{session_id}", response_model=GptSessionDetail)
def get_gpt_session_detail(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(GptSession).filter_by(session_id=session_id).first()
    if not session or session.user_id != current_user.user_id:
        raise HTTPException(
            status_code=404, detail="세션이 없거나 접근 권한이 없습니다."
        )
    return session


# ✅ 5. GPT 세션 삭제
@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gpt_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(GptSession).filter_by(session_id=session_id).first()
    if not session or session.user_id != current_user.user_id:
        raise HTTPException(
            status_code=404, detail="세션이 없거나 접근 권한이 없습니다."
        )

    db.delete(session)
    db.commit()
    return


# ✅ 6. GPT 세션 제목 수정
@router.patch("/sessions/{session_id}", status_code=200)
def update_gpt_session_title(
    session_id: int,
    request: GptSessionUpdateTitle,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(GptSession).filter_by(session_id=session_id).first()
    if not session or session.user_id != current_user.user_id:
        raise HTTPException(
            status_code=404, detail="세션이 없거나 접근 권한이 없습니다."
        )

    session.title = request.title
    db.commit()
    return {"message": "세션 제목이 변경되었습니다."}
