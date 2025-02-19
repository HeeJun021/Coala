# from passlib.context import CryptContext
# from sqlalchemy.orm import Session
# from app.models.user import User

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# def hash_password(password: str) -> str:
#     """ 비밀번호를 해싱하는 함수 """
#     return pwd_context.hash(password)

# def create_user(db: Session, username: str, password: str):
#     """ 새 사용자를 생성하는 함수 """
#     hashed_password = hash_password(password)  # 해싱 적용
#     new_user = User(username=username, password=hashed_password)
#     db.add(new_user)
#     db.commit()
#     db.refresh(new_user)
#     return new_user
