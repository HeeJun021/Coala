from pydantic import BaseModel

class StudyMaterialReadCreate(BaseModel):
    user_id: int
    material_id: int
