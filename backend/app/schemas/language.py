from pydantic import BaseModel

class LanguageResponse(BaseModel):
    language_id: int
    language: str

    class Config:
        from_attributes = True  # ✅ Pydantic v2에서 orm_mode 대신 사용
