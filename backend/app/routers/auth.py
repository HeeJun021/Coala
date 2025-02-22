import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from datetime import datetime, timedelta


from app.models.user import User
from app.models.email_verification import EmailVerificationToken  # 기존 이메일 인증 테이블 사용
from app.database import get_db
from app.utils.security import hash_password
from app.utils.email import send_verification_email
from app.utils.security import verify_password

from app.schemas.auth import EmailVerificationRequest, EmailVerificationConfirm, PasswordResetConfirm, LoginRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ✅ 로그인 API (세션 생성)
@router.post("/login")
def login(request: Request, response: Response, login_data: LoginRequest, db: Session = Depends(get_db)):
    # 1️⃣ 이메일 확인
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="이메일이 등록되지 않았습니다.")

    # 2️⃣ 비밀번호 검증
    if not verify_password(login_data.password, user.password):
        raise HTTPException(status_code=400, detail="비밀번호가 일치하지 않습니다.")

    # 3️⃣ 세션에 사용자 저장
    request.session["user_id"] = user.user_id
    request.session["email"] = user.email

    return {"message": "로그인 성공!"}

# ✅ 로그아웃 API (세션 삭제)
@router.post("/logout")
def logout(request: Request):
    request.session.clear()  # 세션 삭제
    return {"message": "로그아웃 완료!"}

@router.get("/me")
def get_current_user(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    return {"user_id": user.user_id, "email": user.email, "nickname": user.nickname}


# ✅ 1. 이메일 인증 요청 (비밀번호 재설정용)
@router.post("/password-reset/email", response_model=dict)
def request_password_reset_email(request: EmailVerificationRequest, db: Session = Depends(get_db)):
    print(f"📌 요청된 이메일: {request.email}")  # 🔥 요청된 이메일 확인

    # 이메일을 소문자로 변환하여 비교
    user = db.query(User).filter(User.email.ilike(request.email)).first()

    print(f"📌 데이터베이스에서 찾은 사용자: {user}")  # 🔥 DB에서 조회된 결과 확인

    if not user:
        raise HTTPException(status_code=404, detail="등록되지 않은 이메일입니다.")

    # 기존 이메일 인증 코드 삭제
    db.query(EmailVerificationToken).filter(EmailVerificationToken.email == request.email).delete()

    # 새로운 인증 코드 생성
    verification_token = str(uuid.uuid4())[:6]  # 6자리 코드 생성
    expires_at = datetime.utcnow() + timedelta(minutes=5)  # 5분 유효

    new_token = EmailVerificationToken(email=request.email, token=verification_token, expires_at=expires_at)
    db.add(new_token)
    db.commit()

    # 이메일 발송 ✅
    send_verification_email(request.email, f"비밀번호 재설정 인증 코드: {verification_token}")

    return {"message": "비밀번호 재설정 인증 코드가 이메일로 전송되었습니다."}



# ✅ 2. 이메일 인증 확인 (비밀번호 재설정 가능 여부 체크)
@router.post("/password-reset/verify", response_model=dict)
def verify_password_reset_email(request: EmailVerificationConfirm, db: Session = Depends(get_db)):
    token_entry = db.query(EmailVerificationToken).filter(
        EmailVerificationToken.email == request.email,
        EmailVerificationToken.token == request.token,
        EmailVerificationToken.expires_at > datetime.utcnow()
    ).first()

    if not token_entry:
        raise HTTPException(status_code=400, detail="잘못된 인증 코드이거나 만료되었습니다.")

    # 인증 성공 → 데이터 삭제
    db.delete(token_entry)
    db.commit()

    return {"message": "이메일 인증이 완료되었습니다. 이제 비밀번호를 변경할 수 있습니다."}

# ✅ 3. 비밀번호 변경 (이메일 인증이 완료된 사용자만 가능)
@router.post("/password-reset/change", response_model=dict)
def change_password(request: PasswordResetConfirm, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="등록되지 않은 이메일입니다.")

    # 비밀번호 해싱 후 업데이트
    user.password = hash_password(request.new_password)
    db.commit()

    return {"message": "비밀번호가 성공적으로 변경되었습니다. 이제 새 비밀번호로 로그인하세요."}
