from pydantic import BaseModel

class ExampleReadCreate(BaseModel):
    user_id: int
    example_id: int
