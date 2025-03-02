# import requests
# import os
# from fastapi import APIRouter, HTTPException, Depends
# from starlette.responses import RedirectResponse
# from sqlalchemy.orm import Session
# from database import get_db
# from models import User, SocialLogin
# from utils.jwt import create_access_token  # JWT 생성 유틸리티

# router = APIRouter(prefix="/auth/social", tags=["Social Authentication"])

# # ✅ 환경 변수 설정
# GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
# GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
# GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

# KAKAO_CLIENT_ID = os.getenv("KAKAO_CLIENT_ID")
# KAKAO_CLIENT_SECRET = os.getenv("KAKAO_CLIENT_SECRET")
# KAKAO_REDIRECT_URI = os.getenv("KAKAO_REDIRECT_URI")

# GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
# GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
# GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI")

# APPLE_CLIENT_ID = os.getenv("APPLE_CLIENT_ID")
# APPLE_CLIENT_SECRET = os.getenv("APPLE_CLIENT_SECRET")
# APPLE_REDIRECT_URI = os.getenv("APPLE_REDIRECT_URI")


# # ✅ 공통 함수: DB에서 소셜 로그인 사용자 확인 또는 생성
# def get_or_create_user(db: Session, provider: str, provider_user_id: str, email: str, name: str, picture: str):
#     social_login = db.query(SocialLogin).filter_by(provider=provider, provider_user_id=provider_user_id).first()

#     if social_login:
#         # ✅ 기존 사용자 → 로그인 처리
#         user = db.query(User).filter_by(user_id=social_login.user_id).first()
#     else:
#         # ✅ 신규 사용자 → 회원가입 후 로그인 처리
#         new_user = User(email=email, nickname=name, profile_image_url=picture)
#         db.add(new_user)
#         db.commit()
#         db.refresh(new_user)

#         # ✅ social_logins 테이블에 저장
#         new_social_login = SocialLogin(user_id=new_user.user_id, provider=provider, provider_user_id=provider_user_id)
#         db.add(new_social_login)
#         db.commit()

#         user = new_user

#     return user


# # ✅ Google 로그인
# @router.get("/google/login")
# def google_login():
#     google_auth_url = (
#         "https://accounts.google.com/o/oauth2/auth"
#         "?response_type=code"
#         f"&client_id={GOOGLE_CLIENT_ID}"
#         f"&redirect_uri={GOOGLE_REDIRECT_URI}"
#         "&scope=openid%20email%20profile"
#     )
#     return RedirectResponse(google_auth_url)


# @router.get("/google/callback")
# def google_callback(code: str, db: Session = Depends(get_db)):
#     token_url = "https://oauth2.googleapis.com/token"
#     token_data = {
#         "code": code,
#         "client_id": GOOGLE_CLIENT_ID,
#         "client_secret": GOOGLE_CLIENT_SECRET,
#         "redirect_uri": GOOGLE_REDIRECT_URI,
#         "grant_type": "authorization_code",
#     }

#     token_response = requests.post(token_url, data=token_data)
#     token_json = token_response.json()
#     access_token = token_json.get("access_token")

#     if not access_token:
#         raise HTTPException(status_code=400, detail="Google 인증 실패")

#     user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
#     user_info_response = requests.get(user_info_url, headers={"Authorization": f"Bearer {access_token}"})
#     user_info = user_info_response.json()

#     google_user_id = user_info.get("id")
#     email = user_info.get("email")
#     name = user_info.get("name")
#     picture = user_info.get("picture")

#     user = get_or_create_user(db, "Google", google_user_id, email, name, picture)

#     # ✅ JWT 생성 및 쿠키 설정
#     jwt_token = create_access_token(user.user_id)
#     response = RedirectResponse(url="http://localhost:3000")  # ✅ 프론트엔드 URL
#     response.set_cookie("access_token", jwt_token, httponly=True, secure=True, samesite="None")

#     return response


# # ✅ Kakao 로그인
# @router.get("/kakao/login")
# def kakao_login():
#     kakao_auth_url = (
#         "https://kauth.kakao.com/oauth/authorize"
#         "?response_type=code"
#         f"&client_id={KAKAO_CLIENT_ID}"
#         f"&redirect_uri={KAKAO_REDIRECT_URI}"
#     )
#     return RedirectResponse(kakao_auth_url)


# @router.get("/kakao/callback")
# def kakao_callback(code: str, db: Session = Depends(get_db)):
#     token_url = "https://kauth.kakao.com/oauth/token"
#     token_data = {
#         "grant_type": "authorization_code",
#         "client_id": KAKAO_CLIENT_ID,
#         "client_secret": KAKAO_CLIENT_SECRET,
#         "redirect_uri": KAKAO_REDIRECT_URI,
#         "code": code,
#     }

#     token_response = requests.post(token_url, data=token_data)
#     token_json = token_response.json()
#     access_token = token_json.get("access_token")

#     if not access_token:
#         raise HTTPException(status_code=400, detail="Kakao 인증 실패")

#     user_info_url = "https://kapi.kakao.com/v2/user/me"
#     user_info_response = requests.get(user_info_url, headers={"Authorization": f"Bearer {access_token}"})
#     user_info = user_info_response.json()

#     kakao_user_id = str(user_info.get("id"))  # ✅ Kakao 고유 ID는 정수형이므로 문자열로 변환
#     email = user_info.get("kakao_account", {}).get("email", f"kakao_{kakao_user_id}@example.com")
#     name = user_info.get("properties", {}).get("nickname", "Kakao User")
#     picture = user_info.get("properties", {}).get("profile_image", "")

#     user = get_or_create_user(db, "Kakao", kakao_user_id, email, name, picture)

#     jwt_token = create_access_token(user.user_id)
#     response = RedirectResponse(url="http://localhost:3000")
#     response.set_cookie("access_token", jwt_token, httponly=True, secure=True, samesite="None")

#     return response
