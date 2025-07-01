import uuid
import jwt
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

# 모델
from app.models.user import User, UserTier
from app.models.email_verification import EmailVerificationToken

# 데이터베이스
from app.database import get_db

# 유틸리티
from app.utils.security import hash_password, verify_password
from app.utils.email import send_verification_email
from app.utils.jwt import create_access_token, verify_access_token

# 스키마
from app.schemas.auth import (
    EmailVerificationRequest,
    EmailVerificationConfirm,
    PasswordResetConfirm,
    LoginRequest,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# JWT 로그인 API
@router.post("/login")
def jwt_login(request: Request, response: Response, login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    사용자가 이메일과 비밀번호로 로그인하면 JWT를 생성하고 쿠키에 저장합니다.
    """
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(status_code=400, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    # JWT 생성
    access_token = create_access_token(user.user_id)

    # 쿠키에 JWT 저장
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,  # JavaScript에서 접근 불가 (보안 강화)
        secure=False,        # HTTPS에서만 전송 제한 해제
        samesite="Lax",      # ← 개발 중이면 Lax나 None 둘 다 가능
        max_age=1209600
    )

    print(f"🔍 Set-Cookie 헤더 확인: {response.headers}")  # 응답 헤더 출력

    return {"message": "JWT 로그인 성공!", "access_token": access_token}


# 로그아웃 API (세션 삭제)
@router.post("/logout")
def logout(response: Response, request: Request):
    """
    사용자가 로그아웃하면 쿠키에서 JWT를 삭제합니다.
    """
    response.delete_cookie(
        key="access_token",
        path="/",
        samesite="None",
        secure=True,  # ✅ 개발 환경에서는 False (운영 환경에서는 True)
        httponly=True
    )
    
    return {"message": "로그아웃 성공!"}


# JWT 기반 로그인 상태 확인
@router.get("/me")
def get_current_user(request: Request, db: Session = Depends(get_db)):
    """
    사용자의 JWT를 확인하고, 유효한 경우 해당 사용자의 정보를 반환합니다.
    """
    token = request.cookies.get("access_token")  # 쿠키에서 JWT 가져오기
    print(f"🔍 현재 access_token 쿠키: {token}")  # 쿠키 상태 확인

    if not token:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")
        return None

    try:
        payload = verify_access_token(token)  # JWT 검증 함수 사용
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")

        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

        tier_name = db.query(UserTier.tier_name).filter(UserTier.tier_id == user.tier_id).scalar()

        return {
            "user_id": user.user_id,
            "email": user.email,
            "nickname": user.nickname,
            "profile_image_url": user.profile_image_url,
            "rating": user.rating,
            "tier_id": user.tier_id,
            "dailycheck": user.dailycheck,
            "email_verified": user.email_verified,
            "bio": user.bio,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "is_admin": user.is_admin,
            "tier": {"tier_name": user.tier.tier_name} if user.tier else None,
            "eucalyptus_balance": user.eucalyptus_balance,
        }
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="토큰이 만료되었습니다.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")


# 회원가입 이메일 인증 요청 API
@router.post("/email/request", response_model=dict)
def request_signup_email_verification(
    request: EmailVerificationRequest, db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == request.email).first()

    if user:
        raise HTTPException(status_code=400, detail="이미 가입된 이메일입니다.")

    # 기존 이메일 인증 코드 삭제
    db.query(EmailVerificationToken).filter(
        EmailVerificationToken.email == request.email
    ).delete()

    # 새로운 인증 코드 생성
    verification_token = str(uuid.uuid4())[:6]  # 6자리 코드 생성
    expires_at = datetime.utcnow() + timedelta(minutes=5)  # 5분 유효

    new_token = EmailVerificationToken(
        email=request.email, token=verification_token, expires_at=expires_at
    )
    db.add(new_token)
    db.commit()

    # 이메일 발송 
    send_verification_email(request.email, f"회원가입 인증 코드: {verification_token}")

    return {"message": "회원가입 인증 코드가 이메일로 전송되었습니다."}


# 이메일 인증 확인 API
@router.post("/email/verify", response_model=dict)
def verify_signup_email(request: EmailVerificationConfirm, db: Session = Depends(get_db)):
    """
    사용자가 이메일 인증 코드를 입력하면 검증하고, 성공 시 `email_verified` 값을 업데이트합니다.
    """
    token_entry = db.query(EmailVerificationToken).filter(
        EmailVerificationToken.email == request.email,
        EmailVerificationToken.token == request.token
    ).first()

    if not token_entry:
        raise HTTPException(status_code=400, detail="잘못된 인증 코드이거나 만료되었습니다.")

    user = db.query(User).filter(User.email == request.email).first()
    if user:
        user.email_verified = True
    else:
        new_user = User(email=request.email, nickname=request.email.split("@")[0], email_verified=True)
        db.add(new_user)

    db.delete(token_entry)
    db.commit()

    return {"message": "이메일 인증이 완료되었습니다. 회원가입을 진행하세요."}


# 비밀번호 재설정 이메일 요청 API
@router.post("/password-reset/email", response_model=dict)
def request_password_reset_email(request: EmailVerificationRequest, db: Session = Depends(get_db)):
    """
    사용자가 비밀번호 재설정을 요청하면 인증 코드를 이메일로 전송합니다.
    """
    user = db.query(User).filter(User.email.ilike(request.email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="등록되지 않은 이메일입니다.")

    db.query(EmailVerificationToken).filter(EmailVerificationToken.email == request.email).delete()

    verification_token = str(uuid.uuid4())[:6]
    new_token = EmailVerificationToken(email=request.email, token=verification_token)
    db.add(new_token)
    db.commit()

    send_verification_email(request.email, f"비밀번호 재설정 인증 코드: {verification_token}")

    return {"message": "비밀번호 재설정 인증 코드가 이메일로 전송되었습니다."}


# 비밀번호 재설정 이메일 인증 확인 API
@router.post("/password-reset/verify", response_model=dict)
def verify_password_reset_email(request: EmailVerificationConfirm, db: Session = Depends(get_db)):
    """
    사용자가 입력한 비밀번호 재설정 인증 코드를 검증합니다.
    """
    token_entry = db.query(EmailVerificationToken).filter(
        EmailVerificationToken.email == request.email,
        EmailVerificationToken.token == request.token
    ).first()

    if not token_entry:
        raise HTTPException(status_code=400, detail="잘못된 인증 코드이거나 만료되었습니다.")

    db.delete(token_entry)
    db.commit()

    return {"message": "이메일 인증이 완료되었습니다. 이제 비밀번호를 변경할 수 있습니다."}


# 비밀번호 변경 API
@router.post("/password-reset/change", response_model=dict)
def change_password(request: PasswordResetConfirm, db: Session = Depends(get_db)):
    """
    사용자가 새 비밀번호를 입력하면 기존 비밀번호를 변경합니다.
    """
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="등록되지 않은 이메일입니다.")

    user.password = hash_password(request.new_password)
    db.commit()

    return {"message": "비밀번호가 성공적으로 변경되었습니다. 이제 새 비밀번호로 로그인하세요."}
