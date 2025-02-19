from fastapi import FastAPI
from app.routers import user  # 사용자 라우터 가져오기
from app.database import engine  # 데이터베이스 연결 엔진
from sqlalchemy import text

# from app.routers import auth  # 로그인 관련 라우터 (새로 만들 예정)


app = FastAPI()

# 라우터 등록
app.include_router(user.router)

# app.include_router(auth.router)  # auth.py에서 라우터를 설정할 예정

# 데이터베이스 연결 테스트 API
@app.get("/db-test", tags=["Database"])
def db_test():
    """데이터베이스 연결 테스트"""
    try:
        # 데이터베이스 연결 확인
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "✅ Database Connected"}
    except Exception as e:
        return {"status": "❌ Database Connection Failed", "error": str(e)}

# 기본 라우트
@app.get("/", tags=["Root"])
def read_root():
    """서버 상태 확인"""
    return {"message": "FastAPI is running!"}
