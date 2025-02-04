from fastapi import APIRouter

router = APIRouter()

@router.get("/ping")  # 테스트용 간단한 엔드포인트
def ping():
    return {"message": "pong"}
