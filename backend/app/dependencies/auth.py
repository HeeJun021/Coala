from fastapi import Request, HTTPException, Depends
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.social_login import SocialLogin
from app.config import settings
from typing import Optional

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get("access_token")  # 🍪 쿠키에서 access_token 꺼냄
    if token is None:
        raise HTTPException(status_code=401, detail="Access token missing")

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    user = db.query(User).filter(User.user_id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    # GitHub 액세스 토큰 설정 (SocialLogin에서 가져옴)
    social_login = db.query(SocialLogin).filter(
        SocialLogin.user_id == user_id,
        SocialLogin.provider == "github"
    ).first()
    if social_login and social_login.access_token:
        user.github_access_token = social_login.access_token

    return user  # ✅ github_access_token이 포함된 User 객체 반환