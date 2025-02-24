from pydantic import BaseModel

# ✅ StudyExample API 응답 모델


class StudyExampleResponse(BaseModel):
    id: int
    title: str
    content: str
    language: str

    class Config:
        orm_mode = True  # SQLAlchemy 모델을 Pydantic으로 변환
