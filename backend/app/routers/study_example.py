from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def get_examples():
    return {"message": "✅ 예제 목록"}
