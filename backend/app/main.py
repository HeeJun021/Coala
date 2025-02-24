from fastapi import FastAPI
from app.routers import study_materials_router, study_example_router

app = FastAPI()

# ✅ 라우터 등록
app.include_router(study_materials_router, prefix="/api/materials",
                   tags=["Study Materials"])

app.include_router(study_example_router, prefix="/api/examples",
                   tags=["Study Examples"])


@app.get("/")
def read_root():
    return {"message": "🚀 FastAPI 서버가 정상적으로 실행 중입니다!"}
