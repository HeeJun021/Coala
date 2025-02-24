from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import os
from dotenv import load_dotenv

# ✅ .env 파일에서 환경 변수 로드
load_dotenv()

# ✅ 데이터베이스 URL 설정
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL 환경 변수가 설정되지 않았습니다!")

# ✅ SQLAlchemy 엔진 생성
engine = create_engine(DATABASE_URL)

# ✅ 세션 설정
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ✅ 베이스 클래스 정의
Base = declarative_base()

# ✅ 데이터베이스 세션 의존성 주입 함수


def get_db() -> Session:    # type: ignore
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
