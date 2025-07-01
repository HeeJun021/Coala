from pydantic import BaseModel

class LanguageResponse(BaseModel):
    language_id: int
    language: str

    class Config:
        from_attributes = True  
