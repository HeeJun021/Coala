from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base  # ✅ declarative_base 추가
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# 환경 변수에서 DATABASE_URL 가져오기
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:1234@localhost:5432/Coala")

# SQLAlchemy 엔진 생성
engine = create_engine(DATABASE_URL)

# 세션 로컬 클래스 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ✅ Base 클래스를 생성 (이 부분이 없어서 오류 발생)
Base = declarative_base()

# 데이터베이스 세션을 반환하는 의존성 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
