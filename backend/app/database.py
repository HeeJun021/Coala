from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# 환경 변수에서 DATABASE_URL 가져오기
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:1234@localhost:5432/Coala")

# SQLAlchemy 엔진 생성
engine = create_engine(DATABASE_URL)

# 데이터베이스 연결 테스트 함수
def test_db_connection():
    try:
        with engine.connect() as connection:
            # ✅ text()를 사용하여 실행해야 함
            connection.execute(text("SELECT 1"))  
        return True
    except Exception as e:
        print(f"❌ Database Connection Error: {e}")
        return False
