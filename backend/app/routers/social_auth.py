import requests
import os
import jwt
from fastapi import APIRouter, HTTPException, Depends
from starlette.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.database import get_db  
from app.models.user import User
from app.models.social_login import SocialLogin
from app.utils.jwt import create_access_token
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/auth/social", tags=["Social Authentication"])

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
    "naver": {
        "client_id": os.getenv("NAVER_CLIENT_ID"),
        "client_secret": os.getenv("NAVER_CLIENT_SECRET"),
        "redirect_uri": os.getenv("NAVER_REDIRECT_URI"),
        "auth_url": "https://nid.naver.com/oauth2.0/authorize",
        "token_url": "https://nid.naver.com/oauth2.0/token",
        "user_info_url": "https://openapi.naver.com/v1/nid/me",
    }
}

# ✅ 닉네임 중복 방지
def get_unique_nickname(db: Session, base_nickname: str):
    """ 닉네임이 중복되지 않으면 그대로 사용하고, 중복되면 숫자를 붙여서 유니크하게 만듦 """
    
    # ✅ 닉네임이 중복되지 않으면 그대로 반환
    existing_user = db.query(User).filter(User.nickname == base_nickname).first()
    if not existing_user:
        return base_nickname  # ✅ 중복되지 않으므로 그대로 사용

    # ✅ 중복되면 숫자를 붙여서 새로운 닉네임 찾기
    count = 1
    new_nickname = f"{base_nickname}_{count}"
    
    while db.query(User).filter(User.nickname == new_nickname).first():
        count += 1
        new_nickname = f"{base_nickname}_{count}"

    return new_nickname  # ✅ 중복되지 않는 닉네임 반환

# ✅ date 타입으로 변환
def parse_birth_date(birthyear: Optional[str], birthday: Optional[str]) -> Optional[datetime.date]:
    """ 네이버에서 제공하는 birthyear(YYYY)와 birthday(MM-DD)를 YYYY-MM-DD 형식으로 변환 """
    if birthyear and birthday:
        birth_date_str = f"{birthyear}-{birthday}"  # ✅ YYYY-MM-DD 문자열 변환
        try:
            return datetime.strptime(birth_date_str, "%Y-%m-%d").date()  # ✅ 문자열을 DATE 타입으로 변환
        except ValueError:
            return None  # 잘못된 날짜 형식일 경우 None 반환
    return None  # birthyear 또는 birthday가 없으면 None 반환

# ✅ 소셜 로그인 사용자 조회 및 생성 (access_token 추가)
def get_or_create_user(db: Session, provider: str, provider_user_id: str, email: str, name: str, picture: str, birth_date: Optional[str], access_token: str = None):
    """ 사용자를 조회하고, 없으면 생성하며, 소셜 로그인 중복을 방지 """
    
    # ✅ 소셜 로그인 중복 검사
    social_login = db.query(SocialLogin).filter_by(provider=provider, provider_user_id=provider_user_id).first()

    if social_login:
        user = db.query(User).filter_by(user_id=social_login.user_id).first()
        if access_token:
            social_login.access_token = access_token
            db.commit()
        return user  # ✅ 기존 사용자 반환

    # ✅ 동일한 이메일이 있는지 확인 (기존 회원이 있는 경우 소셜 계정 연결)
    existing_user = db.query(User).filter(User.email == email).first()

    if existing_user:
        # ✅ 기존 사용자와 소셜 로그인 연결
        new_social_login = SocialLogin(user_id=existing_user.user_id, provider=provider, provider_user_id=provider_user_id, access_token=access_token)
        db.add(new_social_login)
        db.commit()
        return existing_user  # ✅ 기존 사용자 반환

    # ✅ 중복되지 않는 닉네임 생성
    unique_nickname = get_unique_nickname(db, name)

    # ✅ birth_date가 문자열이면 변환, 이미 datetime.date면 그대로 사용
    if isinstance(birth_date, str):
        try:
            birth_date = datetime.strptime(birth_date, "%Y-%m-%d").date()
        except ValueError:
            birth_date = None  # 잘못된 날짜 형식이면 None 저장

    # ✅ 새로운 사용자 생성
    new_user = User(
        email=email,
        nickname=unique_nickname,
        profile_image_url=picture,
        birth_date=birth_date,
        email_verified=True  # ✅ 소셜 로그인은 자동으로 이메일 인증 완료
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # ✅ 소셜 로그인 정보 저장
    new_social_login = SocialLogin(user_id=new_user.user_id, provider=provider, provider_user_id=provider_user_id, access_token=access_token)
    db.add(new_social_login)
    db.commit()

    return new_user  # ✅ 새 사용자 반환

# ✅ 로그인 URL 생성
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

# ✅ 콜백 처리 (access_token 저장 추가)
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
        "grant_type": "authorization_code"
    }

    headers = {"Accept": "application/json"}
    token_response = requests.post(token_url, data=token_data, headers=headers)

    token_response.raise_for_status()
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

    # 카카오는 생일과 이메일을 제공하지 않음
    elif provider == "kakao":
        provider_user_id = str(user_info.get("id"))
        
        # ✅ 이메일을 가져오되 없을 경우 임시 이메일 생성
        email = user_info.get("kakao_account", {}).get("email")
        if not email:
            email = f"kakao_{provider_user_id}@example.com"

        # ✅ 카카오 닉네임 가져오기
        name = user_info.get("properties", {}).get("nickname")
        if not name:
            name = user_info.get("kakao_account", {}).get("profile", {}).get("nickname", "KakaoUser")

        # ✅ 카카오 프로필 이미지 가져오기
        picture = user_info.get("properties", {}).get("profile_image", "")
        if not picture:
            picture = user_info.get("kakao_account", {}).get("profile", {}).get("profile_image_url", "")

    # 깃허브는 기본적으로 생년월일을 제공하지 않음 (디버그 로그 추가)
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
        
        # ✅ 깃허브 닉네임 가져오기 (name, login 확인 후 이메일 앞부분으로 대체)
        name = user_info.get("name")
        if not name:
            name = user_info.get("login")

        if not name and email:  # ✅ name과 login이 없을 경우 이메일에서 닉네임 생성
            name = email.split("@")[0]  # 이메일의 @ 앞부분을 닉네임으로 사용

        if not name:
            name = "GitHubUser"  # ✅ 최종적으로 닉네임이 없으면 기본값 설정
            
         # ✅ 프로필 이미지 가져오기
        picture = user_info.get("avatar_url", "")
        
        # 🔍 디버깅 로그 추가
        print(f"🔍 깃허브 API 응답: {user_info}")
        print(f"🔍 깃허브에서 받은 이메일: {email}")
        print(f"🔍 깃허브에서 받은 닉네임: {name} ({type(name)})")
        print(f"🔍 깃허브에서 받은 프로필 이미지: {picture}")
            

    elif provider == "naver":
        provider_user_id = str(user_info.get("response", {}).get("id"))
        email = user_info.get("response", {}).get("email")
        name = user_info.get("response", {}).get("name", "Naver User")
        picture = user_info.get("response", {}).get("profile_image", "")

    # ✅ 네이버에서 birthyear, birthday 받아오기
    birthyear = user_info.get("response", {}).get("birthyear")
    birthday = user_info.get("response", {}).get("birthday")

    # ✅ 변환 함수 사용하여 birth_date 변환
    birth_date = parse_birth_date(birthyear, birthday)  # ✅ YYYY-MM-DD → DATE 변환

    # ✅ 사용자 조회 또는 생성
    user = get_or_create_user(db, provider, provider_user_id, email, name, picture, birth_date, access_token)

    jwt_token = create_access_token(user.user_id)

    response = RedirectResponse(url="http://localhost:3000")
    response.set_cookie(
        key="access_token",
        value=jwt_token,
        httponly=True,
        secure=True,
        samesite="None",
        domain="localhost",
        path="/",
        max_age=86400
    )

    return response

# ✅ GitHub 연동 해제 추가
@router.post("/unlink/github")
def unlink_github(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    social_login = db.query(SocialLogin).filter_by(user_id=current_user.user_id, provider="github").first()
    if social_login:
        db.delete(social_login)
        db.commit()
    return {"message": "GitHub 연동 해제 완료"}