from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# PostgreSQL 데이터베이스 URL 구성
# "postgresql://<username>:<password>@<host>:<port>/<database>"
DATABASE_URL = "postgresql://postgres:1234@localhost:5432/Coala"

# SQLAlchemy 엔진 생성
engine = create_engine(DATABASE_URL)

# 세션 로컬 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# SQLAlchemy 모델의 Base 클래스 생성
Base = declarative_base()

# 데이터베이스 세션 의존성 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
