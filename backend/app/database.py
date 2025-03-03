from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# ✅ 데이터베이스 엔진 생성
engine = create_engine(DATABASE_URL)

# ✅ ORM 세션 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ✅ Base 클래스 정의
Base = declarative_base()


# ✅ get_db 함수 정의 (순환 참조 문제 없음)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
