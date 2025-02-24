from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def get_materials():
    return {"message": "✅ 학습 자료 목록"}
