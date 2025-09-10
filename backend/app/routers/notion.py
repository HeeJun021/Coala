# app/routers/notion.py
import os
import uuid
import urllib.parse
import base64
import requests

from fastapi import APIRouter, HTTPException, Depends, Request
from starlette.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from cryptography.fernet import Fernet

from app.database import get_db
from app.models.user import User
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/auth/notion", tags=["Notion"])

NOTION_AUTHORIZE_URL = "https://api.notion.com/v1/oauth/authorize"
NOTION_TOKEN_URL = "https://api.notion.com/v1/oauth/token"

CLIENT_ID = os.getenv("NOTION_CLIENT_ID")
CLIENT_SECRET = os.getenv("NOTION_CLIENT_SECRET")
REDIRECT_URI = os.getenv("NOTION_REDIRECT_URI", "http://localhost:8000/auth/notion/callback")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

FERNET = Fernet(os.getenv("FERNET_SECRET").encode())

STATE_COOKIE_KEY = "notion_oauth_state"
STATE_COOKIE_MAX_AGE = 600  # 10분


def build_authorize_url(state: str) -> str:
    params = {
        "client_id": CLIENT_ID,
        "response_type": "code",
        "owner": "user",
        "redirect_uri": REDIRECT_URI,
        "state": state,
    }
    return f"{NOTION_AUTHORIZE_URL}?{urllib.parse.urlencode(params)}"


@router.get("/login")
def notion_login():
    """
    프론트에서 호출: authorize_url 반환
    프론트는 이 URL로 window.location.href 이동
    """
    if not CLIENT_ID or not CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Notion OAuth env is not configured")

    state = str(uuid.uuid4())
    authorize_url = build_authorize_url(state)

    # state는 콜백에서 검증해야 하므로, 프론트가 저장/전달하기 어렵다면
    # 서버 쿠키로 내려보내고 콜백에서 비교한다.
    resp = JSONResponse({"authorize_url": authorize_url, "state": state})
    # 로컬 개발 환경이라면 secure=False 권장(HTTP). 배포 시 True+HTTPS 권장.
    resp.set_cookie(
        key=STATE_COOKIE_KEY,
        value=state,
        max_age=STATE_COOKIE_MAX_AGE,
        httponly=True,
        samesite="Lax",
        secure=False,
        path="/",
    )
    return resp


@router.get("/callback")
def notion_callback(request: Request, code: str, state: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    노션에서 돌아오는 콜백: code -> access_token 교환 & DB 저장
    """
    # 1) state 검증 (CSRF 방지)
    state_cookie = request.cookies.get(STATE_COOKIE_KEY)
    if not state_cookie or state_cookie != state:
        raise HTTPException(status_code=400, detail="Invalid state")

    # 2) 토큰 교환 (Basic Auth)
    basic = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    headers = {
        "Authorization": f"Basic {basic}",
        "Content-Type": "application/json",
    }
    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
    }
    token_resp = requests.post(NOTION_TOKEN_URL, headers=headers, json=payload, timeout=15)
    if token_resp.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Notion token exchange failed: {token_resp.text}")

    data = token_resp.json()
    access_token = data.get("access_token")
    workspace_id = data.get("workspace_id")
    workspace_name = data.get("workspace_name")

    if not access_token or not workspace_id:
        raise HTTPException(status_code=400, detail="Invalid token response from Notion")

    # 3) 토큰 암호화 & 저장
    encrypted = FERNET.encrypt(access_token.encode()).decode()

    user: User = db.query(User).filter(User.user_id == current_user.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.notion_token = encrypted
    user.notion_workspace = workspace_name or "연결된 워크스페이스"
    db.commit()

    # 4) 프론트로 이동 (마이페이지 포트폴리오)
    resp = RedirectResponse(url=f"{FRONTEND_ORIGIN}/mypage/portfolio")
    # state 쿠키 제거(선택)
    resp.delete_cookie(STATE_COOKIE_KEY, path="/")
    return resp


@router.get("/status")
def notion_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    연결 상태 확인: 프론트 패널 표시 용도
    """
    user: User = db.query(User).filter(User.user_id == current_user.user_id).first()
    if user and user.notion_token:
        return {"connected": True, "workspace_name": user.notion_workspace or "연결된 워크스페이스"}
    return {"connected": False}


@router.post("/disconnect")
def notion_disconnect(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    노션 연결 해제: 토큰/워크스페이스 제거
    """
    user: User = db.query(User).filter(User.user_id == current_user.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.notion_token = None
    user.notion_workspace = None
    db.commit()
    return {"ok": True}
