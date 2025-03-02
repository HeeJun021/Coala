import jwt
import os
from datetime import datetime, timedelta
from fastapi import HTTPException

SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key")  # ✅ 환경 변수에서 가져오기
ALGORITHM = "HS256"


def create_access_token(user_id: int, expires_delta: timedelta = timedelta(days=14)):
    """✅ JWT 액세스 토큰 생성"""
    expire = datetime.utcnow() + expires_delta
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
