# backend/app/routers/notion.py
import os
import uuid
import urllib.parse
import base64
import logging
import requests

from fastapi import APIRouter, HTTPException, Depends, Request
from starlette.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from cryptography.fernet import Fernet

from app.database import get_db
from app.models.user import User
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/auth/notion", tags=["Notion"])

# ===== Notion OAuth Endpoints =====
NOTION_AUTHORIZE_URL = "https://api.notion.com/v1/oauth/authorize"
NOTION_TOKEN_URL = "https://api.notion.com/v1/oauth/token"

# ===== Environment Vars =====
CLIENT_ID = os.getenv("NOTION_CLIENT_ID")
CLIENT_SECRET = os.getenv("NOTION_CLIENT_SECRET")
REDIRECT_URI = os.getenv("NOTION_REDIRECT_URI", "http://localhost:8000/auth/notion/callback")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
NOTION_API_VERSION = os.getenv("NOTION_API_VERSION", "2022-06-28")

FERNET_SECRET = os.getenv("FERNET_SECRET")
if not FERNET_SECRET:
    raise RuntimeError("FERNET_SECRET is not set")
FERNET = Fernet(FERNET_SECRET.encode())

# ===== Cookies / State =====
STATE_COOKIE_KEY = "notion_oauth_state"
STATE_COOKIE_MAX_AGE = 600  # seconds (10 min)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

def build_authorize_url(state: str) -> str:
    """
    Public Integration용 OAuth Authorize URL 생성
    owner=user 가 핵심 (사용자 워크스페이스용)
    """
    params = {
        "client_id": CLIENT_ID,
        "response_type": "code",
        "owner": "user",
        "redirect_uri": REDIRECT_URI,
        "state": state,
        # 노션은 scope 파라미터를 URL에서 받지 않고, 개발자 콘솔에서 설정합니다.
    }
    return f"{NOTION_AUTHORIZE_URL}?{urllib.parse.urlencode(params)}"


@router.get("/login")
def notion_login():
    """
    프론트에서 호출: authorize_url 반환
    - 프론트는 이 URL로 리다이렉트해서 노션 로그인/동의 화면으로 보냄
    - CSRF 방지를 위해 state를 httpOnly 쿠키로 내려줌
    """
    if not CLIENT_ID or not CLIENT_SECRET or not REDIRECT_URI:
        raise HTTPException(status_code=500, detail="Notion OAuth env is not configured")

    state = str(uuid.uuid4())
    authorize_url = build_authorize_url(state)

    resp = JSONResponse({"authorize_url": authorize_url, "state": state})
    # 개발(HTTP) 환경: secure=False, samesite=Lax
    # 운영(HTTPS/서브도메인 포함) 환경: secure=True, samesite=None 권장
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
def notion_callback(
    request: Request,
    code: str,
    state: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    노션 OAuth 콜백 엔드포인트
    - code -> access_token 교환
    - 암호화하여 DB 저장
    - 프론트로 리다이렉트
    """
    # 1) state 검증
    state_cookie = request.cookies.get(STATE_COOKIE_KEY)
    if not state_cookie or state_cookie != state:
        logger.error("State mismatch. cookie=%s, query=%s", state_cookie, state)
        raise HTTPException(status_code=400, detail="Invalid state")

    # 2) 토큰 교환 (Basic Auth)
    basic = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    headers = {
        "Authorization": f"Basic {basic}",
        "Content-Type": "application/json",
        # 토큰 교환에는 필수는 아니지만, 이후 API 호출과 일관성 위해 포함해도 무방
        "Notion-Version": NOTION_API_VERSION,
    }
    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
    }

    try:
        token_resp = requests.post(NOTION_TOKEN_URL, headers=headers, json=payload, timeout=15)
    except requests.RequestException as e:
        logger.exception("Token request error: %s", e)
        raise HTTPException(status_code=502, detail="Failed to reach Notion OAuth endpoint")

    if token_resp.status_code != 200:
        logger.error("Token exchange failed: %s", token_resp.text)
        raise HTTPException(status_code=400, detail=f"Notion token exchange failed: {token_resp.text}")

    data = token_resp.json()
    access_token = data.get("access_token")
    workspace_id = data.get("workspace_id")
    workspace_name = data.get("workspace_name")
    bot_id = data.get("bot_id")
    workspace_icon = data.get("workspace_icon")

    if not access_token or not workspace_id:
        logger.error("Invalid token response: %s", data)
        raise HTTPException(status_code=400, detail="Invalid token response from Notion")

    # 3) 토큰 암호화 & 저장
    encrypted = FERNET.encrypt(access_token.encode()).decode()

    user: User = db.query(User).filter(User.user_id == current_user.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.notion_token = encrypted
    user.notion_workspace = workspace_name or "연결된 워크스페이스"
    # 선택 컬럼 (있으면 저장)
    if hasattr(user, "notion_workspace_id"):
        user.notion_workspace_id = workspace_id
    if hasattr(user, "notion_bot_id"):
        user.notion_bot_id = bot_id
    if hasattr(user, "notion_workspace_icon"):
        user.notion_workspace_icon = workspace_icon

    db.commit()

    # 4) 프론트로 이동 + state 쿠키 제거
    resp = RedirectResponse(url=f"{FRONTEND_ORIGIN}/mypage/portfolio")
    resp.delete_cookie(STATE_COOKIE_KEY, path="/")
    return resp


@router.get("/status")
def notion_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    연결 상태 확인: 프론트 패널 표시 용도
    """
    user: User = db.query(User).filter(User.user_id == current_user.user_id).first()
    if user and user.notion_token:
        return {
            "connected": True,
            "workspace_name": user.notion_workspace or "연결된 워크스페이스",
            "workspace_id": getattr(user, "notion_workspace_id", None),
            "workspace_icon": getattr(user, "notion_workspace_icon", None),
        }
    return {"connected": False}


@router.post("/disconnect")
def notion_disconnect(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    노션 연결 해제: 로컬 저장 토큰/워크스페이스 정보 제거
    (노션 측 revoke 는 일반적으로 불필요)
    """
    user: User = db.query(User).filter(User.user_id == current_user.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.notion_token = None
    user.notion_workspace = None
    if hasattr(user, "notion_workspace_id"):
        user.notion_workspace_id = None
    if hasattr(user, "notion_bot_id"):
        user.notion_bot_id = None
    if hasattr(user, "notion_workspace_icon"):
        user.notion_workspace_icon = None

    db.commit()
    return {"ok": True}
