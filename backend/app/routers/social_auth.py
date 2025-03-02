import requests
import os
import jwt
from fastapi import APIRouter, HTTPException, Depends
from starlette.responses import RedirectResponse
from sqlalchemy.orm import Session

# ✅ 데이터베이스 경로 수정
from app.database import get_db  

# ✅ 모델 임포트 경로 수정
from app.models.user import User
from app.models.social_login import SocialLogin

# ✅ JWT 유틸리티 경로 수정
from app.utils.jwt import create_access_token

router = APIRouter(prefix="/auth/social", tags=["Social Authentication"])

# ✅ 환경 변수 설정
PROVIDERS = {
    "google": {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "redirect_uri": os.getenv("GOOGLE_REDIRECT_URI"),
        "auth_url": "https://accounts.google.com/o/oauth2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "user_info_url": "https://www.googleapis.com/oauth2/v2/userinfo",
    },
    "kakao": {
        "client_id": os.getenv("KAKAO_CLIENT_ID"),
        "client_secret": os.getenv("KAKAO_CLIENT_SECRET"),
        "redirect_uri": os.getenv("KAKAO_REDIRECT_URI"),
        "auth_url": "https://kauth.kakao.com/oauth/authorize",
        "token_url": "https://kauth.kakao.com/oauth/token",
        "user_info_url": "https://kapi.kakao.com/v2/user/me",
    },
    "github": {
        "client_id": os.getenv("GITHUB_CLIENT_ID"),
        "client_secret": os.getenv("GITHUB_CLIENT_SECRET"),
        "redirect_uri": os.getenv("GITHUB_REDIRECT_URI"),
        "auth_url": "https://github.com/login/oauth/authorize",
        "token_url": "https://github.com/login/oauth/access_token",
        "user_info_url": "https://api.github.com/user",
        "email_info_url": "https://api.github.com/user/emails",
    },
    "apple": {
        "client_id": os.getenv("APPLE_CLIENT_ID"),
        "client_secret": os.getenv("APPLE_CLIENT_SECRET"),
        "redirect_uri": os.getenv("APPLE_REDIRECT_URI"),
        "auth_url": "https://appleid.apple.com/auth/authorize",
        "token_url": "https://appleid.apple.com/auth/token",
    }
}

# 닉네임 중복방지
def get_unique_nickname(db: Session, base_nickname: str):
    """닉네임 중복 방지를 위해 숫자를 추가하여 고유 닉네임 생성"""
    nickname = base_nickname
    count = 1
    while db.query(User).filter(User.nickname == nickname).first():
        nickname = f"{base_nickname}{count}"
        count += 1
    return nickname

# ✅ 공통 함수: DB에서 소셜 로그인 사용자 확인 또는 생성
def get_or_create_user(db: Session, provider: str, provider_user_id: str, email: str, name: str, picture: str):
    social_login = db.query(SocialLogin).filter_by(provider=provider, provider_user_id=provider_user_id).first()

    if social_login:
        user = db.query(User).filter_by(user_id=social_login.user_id).first()
    else:
        unique_nickname = get_unique_nickname(db, f"{name}_{provider_user_id}")

        new_user = User(email=email, nickname=unique_nickname, profile_image_url=picture)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        new_social_login = SocialLogin(user_id=new_user.user_id, provider=provider, provider_user_id=provider_user_id)
        db.add(new_social_login)
        db.commit()

        user = new_user

    return user


# ✅ 공통 로그인 URL 생성
@router.get("/{provider}/login")
def social_login(provider: str):
    if provider not in PROVIDERS:
        raise HTTPException(status_code=400, detail="지원하지 않는 소셜 로그인입니다.")

    provider_info = PROVIDERS[provider]
    auth_url = (
        f"{provider_info['auth_url']}?response_type=code"
        f"&client_id={provider_info['client_id']}"
        f"&redirect_uri={provider_info['redirect_uri']}"
    )

    if provider == "google":
        auth_url += "&scope=openid%20email%20profile"
    elif provider == "github":
        auth_url += "&scope=user:email"

    return RedirectResponse(auth_url)


# ✅ 공통 콜백 처리
@router.get("/{provider}/callback")
def social_callback(provider: str, code: str, db: Session = Depends(get_db)):
    if provider not in PROVIDERS:
        raise HTTPException(status_code=400, detail="지원하지 않는 소셜 로그인입니다.")

    provider_info = PROVIDERS[provider]
    token_url = provider_info["token_url"]

    token_data = {
        "client_id": provider_info["client_id"],
        "client_secret": provider_info["client_secret"],
        "redirect_uri": provider_info["redirect_uri"],
        "code": code,
    }

    if provider == "apple":
        token_data["grant_type"] = "authorization_code"
    elif provider in ["google", "kakao", "github"]:
        token_data["grant_type"] = "authorization_code"

    headers = {"Accept": "application/json"}
    token_response = requests.post(token_url, data=token_data, headers=headers)
    token_json = token_response.json()
    access_token = token_json.get("access_token")

    if not access_token:
        raise HTTPException(status_code=400, detail=f"{provider} 인증 실패")

    # ✅ 사용자 정보 가져오기
    user_info_url = provider_info.get("user_info_url")
    headers = {"Authorization": f"Bearer {access_token}"}
    user_info_response = requests.get(user_info_url, headers=headers)
    user_info = user_info_response.json()

    provider_user_id, email, name, picture = None, None, None, None

    if provider == "google":
        provider_user_id = user_info.get("id")
        email = user_info.get("email")
        name = user_info.get("name")
        picture = user_info.get("picture")

    elif provider == "kakao":
        provider_user_id = str(user_info.get("id"))
        email = user_info.get("kakao_account", {}).get("email", f"kakao_{provider_user_id}@example.com")
        name = user_info.get("properties", {}).get("nickname", "Kakao User")
        picture = user_info.get("properties", {}).get("profile_image", "")

    elif provider == "github":
        provider_user_id = str(user_info.get("id"))
        name = user_info.get("name", "GitHub User")
        picture = user_info.get("avatar_url", "")

        email_info_url = provider_info.get("email_info_url")
        email_response = requests.get(email_info_url, headers=headers)
        email_list = email_response.json()

        for email_data in email_list:
            if email_data.get("primary") and email_data.get("verified"):
                email = email_data.get("email")
                break
        if not email:
            email = f"github_{provider_user_id}@example.com"

    elif provider == "apple":
        id_token = token_json.get("id_token")
        apple_user_info = jwt.decode(id_token, options={"verify_signature": False})
        provider_user_id = apple_user_info.get("sub")
        email = apple_user_info.get("email", f"apple_{provider_user_id}@example.com")
        name = "Apple User"
        picture = ""

    if not provider_user_id:
        raise HTTPException(status_code=400, detail=f"{provider} 사용자 정보를 가져올 수 없습니다.")

    user = get_or_create_user(db, provider, provider_user_id, email, name, picture)

    jwt_token = create_access_token(user.user_id)
    response = RedirectResponse(url="http://localhost:3000")
    response.set_cookie("access_token", jwt_token, httponly=True, secure=True, samesite="None")

    return response
