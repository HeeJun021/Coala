from pydantic import BaseModel
from datetime import datetime


class StudyExampleResponse(BaseModel):
    example_id: int
    language_id: int
    title: str
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
