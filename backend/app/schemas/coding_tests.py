from pydantic import BaseModel

class CodingTestSubmissionCreate(BaseModel):
    user_id: int
    test_id: int
    code: str
    language: str
