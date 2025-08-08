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


# ✅ 1. 새 세션 + 첫 질문 (제목 자동 생성 포함)
@router.post("/sessions/new", response_model=GptSingleResponse)
def create_gpt_session(
    request: GptSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 🔹 1. 제목 생성용 프롬프트 작성
    title_prompt = f"""
다음 문장을 간결한 제목으로 만들어줘.
- 목적: AI 채팅의 주제 제목
- 조건: 5단어 이하, 핵심 키워드 위주, 자연스러운 문장 또는 구
- 예시 입력: '리액트에서 상태 관리 어떻게 하는지 알려줘'
- 예시 출력: '리액트 상태 관리'
- 입력 문장: "{request.message}"
"""

    try:
        # 🔹 2. GPT에게 제목 요청
        title_response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "당신은 핵심 요약 제목을 생성하는 비서입니다."},
                {"role": "user", "content": title_prompt},
            ],
        )
        generated_title = title_response.choices[0].message.content.strip().replace('"', "")
        if not generated_title:
            generated_title = request.message[:30]  # fallback
    except Exception as e:
        print("❌ 제목 생성 GPT 예외 발생:", e)
        generated_title = request.message[:30]  # fallback

    # 🔹 3. 세션 생성 (제목 반영)
    session = GptSession(
        user_id=current_user.user_id,
        context=request.context,
        title=generated_title,
    )
    db.add(session)
    db.flush()

    # 🔹 4. 사용자 메시지 저장
    user_msg = GptMessage(
        session_id=session.session_id,
        sender_type="user",
        content=request.message,
    )
    db.add(user_msg)

    # 🔹 5. GPT 응답 생성
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
        print("❌ GPT 응답 예외 발생:", e)
        raise HTTPException(status_code=500, detail=f"GPT 응답 실패: {e}")

    # 🔹 6. GPT 응답 저장
    gpt_msg = GptMessage(
        session_id=session.session_id,
        sender_type="assistant",
        content=answer,
    )
    db.add(gpt_msg)
    db.commit()

    return {"session_id": session.session_id, "response": answer}



# 2. 기존 세션에 이어서 질문하기
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
        print("GPT 예외 발생:", e)
        raise HTTPException(status_code=500, detail=f"GPT 응답 실패: {e}")

    gpt_msg = GptMessage(
        session_id=session_id,
        sender_type="assistant",
        content=answer,
    )
    db.add(gpt_msg)

    session.updated_at = db.execute(text("SELECT CURRENT_TIMESTAMP")).scalar()
    db.commit()

    return {"session_id": session.session_id, "response": answer}  # 반드시 포함


# 3. GPT 세션 목록 조회
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


# 4. GPT 세션 상세 조회
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


# 5. GPT 세션 삭제
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


# 6. GPT 세션 제목 수정
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
