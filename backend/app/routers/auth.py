import uuid
import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from datetime import datetime, timedelta  # ✅ 올바른 임포트 방식


from app.models.user import User
from app.models.email_verification import (
    EmailVerificationToken,
)  # 기존 이메일 인증 테이블 사용
from app.database import get_db
from app.utils.security import hash_password
from app.utils.email import send_verification_email
from app.utils.security import verify_password

from app.schemas.auth import (
    EmailVerificationRequest,
    EmailVerificationConfirm,
    PasswordResetConfirm,
    LoginRequest,
)

SECRET_KEY = "your_secret_key"  # ✅ JWT 서명용 키
ALGORITHM = "HS256"  # ✅ 암호화 알고리즘

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ✅ 로그인 API (세션 생성)
# @router.post("/login")
# def login(request: Request, response: Response, login_data: LoginRequest, db: Session = Depends(get_db)):
#     # 1️⃣ 이메일 확인
#     user = db.query(User).filter(User.email == login_data.email).first()
#     if not user:
#         raise HTTPException(status_code=400, detail="이메일이 등록되지 않았습니다.")

#     # 2️⃣ 비밀번호 검증
#     if not verify_password(login_data.password, user.password):
#         raise HTTPException(status_code=400, detail="비밀번호가 일치하지 않습니다.")

#     # ✅ 세션 저장 (FastAPI의 session 기능)
#     request.session["session_id"] = f"session_{user.user_id}"
#     response.set_cookie(key="session_id", value=f"session_{user.user_id}", httponly=True)

#     print(f"🔍 Set-Cookie 헤더 확인: {response.headers}")  # ✅ 로그 추가
#     print(f"🔍 세션 저장됨: {request.session}")  # ✅ 디버깅 로그 추가

#     return {"message": "로그인 성공!"}

def create_access_token(user_id: int):
    """✅ JWT 액세스 토큰 생성"""
    expire = datetime.utcnow() + timedelta(days=14)  # ✅ 수정: `datetime.datetime.utcnow()` → `datetime.utcnow()`
    payload = {"user_id": user_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_access_token(token: str):
    """✅ JWT 검증"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="토큰이 만료되었습니다.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")
    
@router.post("/login")
def jwt_login(request: Request, response: Response, login_data: LoginRequest, db: Session = Depends(get_db)):
    """✅ JWT 로그인 API"""
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(status_code=400, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    # ✅ JWT 생성
    access_token = create_access_token(user.user_id)

    # ✅ 쿠키에 JWT 저장
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,  # ✅ JavaScript에서 접근 불가 (보안 강화)
        secure=True,    # ✅ 개발 환경에서는 False (배포 환경에서는 True)
        samesite="None",  # ✅ 크로스 사이트 요청에서도 유지
        max_age=1209600
    )
    
    print(f"🔍 Set-Cookie 헤더 확인: {response.headers}")  # ✅ 응답 헤더 출력

    return {"message": "JWT 로그인 성공!", "access_token": access_token}




# ✅ 로그아웃 API (세션 삭제)
@router.post("/logout")
def logout(response: Response):
    """✅ JWT 로그아웃 (쿠키 삭제)"""
    response.delete_cookie("access_token")  # ✅ JWT 삭제
    return {"message": "로그아웃 성공!"}


@router.get("/me")
def get_current_user(request: Request, db: Session = Depends(get_db)):
    """✅ JWT 기반 로그인 상태 확인"""
    token = request.cookies.get("access_token")  # ✅ 쿠키에서 JWT 가져오기
    if not token:
        print("🚨 [서버 로그] 쿠키에서 access_token이 없음!")
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])  # ✅ JWT 검증
        user_id = payload.get("user_id")  # ✅ JWT에서 user_id 추출
        if not user_id:
            raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")

        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

        return {"user_id": user.user_id, "email": user.email, "nickname": user.nickname}
    except jwt.ExpiredSignatureError:
        print("🚨 [서버 로그] 토큰이 만료됨")
        raise HTTPException(status_code=401, detail="토큰이 만료되었습니다.")
    except jwt.InvalidTokenError:
        print("🚨 [서버 로그] 유효하지 않은 토큰")
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")


# ✅ 회원가입 이메일 인증 요청 API
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

    # 이메일 발송 ✅
    send_verification_email(request.email, f"회원가입 인증 코드: {verification_token}")

    return {"message": "회원가입 인증 코드가 이메일로 전송되었습니다."}


@router.post("/email/verify", response_model=dict)
def verify_signup_email(
    request: EmailVerificationConfirm, db: Session = Depends(get_db)
):
    token_entry = (
        db.query(EmailVerificationToken)
        .filter(
            EmailVerificationToken.email == request.email,
            EmailVerificationToken.token == request.token,
            EmailVerificationToken.expires_at > datetime.utcnow(),
        )
        .first()
    )

    if not token_entry:
        raise HTTPException(
            status_code=400, detail="잘못된 인증 코드이거나 만료되었습니다."
        )

    # ✅ `users` 테이블에서 해당 이메일이 존재하는지 확인
    user = db.query(User).filter(User.email == request.email).first()

    if user:
        # ✅ 기존 사용자가 있으면 `email_verified` 값만 업데이트
        user.email_verified = True
    else:
        # ✅ 존재하지 않으면 기본 닉네임을 추가하여 새로운 사용자 생성
        default_nickname = request.email.split("@")[
            0
        ]  # 이메일 앞부분을 닉네임으로 설정
        new_user = User(
            email=request.email,
            nickname=default_nickname,  # ✅ 기본 닉네임 설정 (이메일 앞부분)
            email_verified=True,
        )
        db.add(new_user)

    db.commit()

    # ✅ 인증 완료 후 토큰 삭제
    db.delete(token_entry)
    db.commit()

    return {"message": "이메일 인증이 완료되었습니다. 회원가입을 진행하세요."}


# ✅ 1. 이메일 인증 요청 (비밀번호 재설정용)
@router.post("/password-reset/email", response_model=dict)
def request_password_reset_email(
    request: EmailVerificationRequest, db: Session = Depends(get_db)
):
    print(f"📌 요청된 이메일: {request.email}")  # 🔥 요청된 이메일 확인

    # 이메일을 소문자로 변환하여 비교
    user = db.query(User).filter(User.email.ilike(request.email)).first()

    print(f"📌 데이터베이스에서 찾은 사용자: {user}")  # 🔥 DB에서 조회된 결과 확인

    if not user:
        raise HTTPException(status_code=404, detail="등록되지 않은 이메일입니다.")

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

    # 이메일 발송 ✅
    send_verification_email(
        request.email, f"비밀번호 재설정 인증 코드: {verification_token}"
    )

    return {"message": "비밀번호 재설정 인증 코드가 이메일로 전송되었습니다."}


# ✅ 2. 이메일 인증 확인 (비밀번호 재설정 가능 여부 체크)
@router.post("/password-reset/verify", response_model=dict)
def verify_password_reset_email(
    request: EmailVerificationConfirm, db: Session = Depends(get_db)
):
    token_entry = (
        db.query(EmailVerificationToken)
        .filter(
            EmailVerificationToken.email == request.email,
            EmailVerificationToken.token == request.token,
            EmailVerificationToken.expires_at > datetime.utcnow(),
        )
        .first()
    )

    if not token_entry:
        raise HTTPException(
            status_code=400, detail="잘못된 인증 코드이거나 만료되었습니다."
        )

    # 인증 성공 → 데이터 삭제
    db.delete(token_entry)
    db.commit()

    return {
        "message": "이메일 인증이 완료되었습니다. 이제 비밀번호를 변경할 수 있습니다."
    }


# ✅ 3. 비밀번호 변경 (이메일 인증이 완료된 사용자만 가능)
@router.post("/password-reset/change", response_model=dict)
def change_password(request: PasswordResetConfirm, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="등록되지 않은 이메일입니다.")

    # 비밀번호 해싱 후 업데이트
    user.password = hash_password(request.new_password)
    db.commit()

    return {
        "message": "비밀번호가 성공적으로 변경되었습니다. 이제 새 비밀번호로 로그인하세요."
    }
