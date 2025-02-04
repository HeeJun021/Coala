import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))  # 현재 디렉토리를 sys.path에 추가
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))  # 상위 디렉토리 추가

from fastapi import FastAPI
from app.routers import users  # users 라우터 가져오기

app = FastAPI()

# users 라우터 등록
app.include_router(users.router, prefix="/users", tags=["users"])

@app.get("/")
def root():
    return {"message": "API is running"}
