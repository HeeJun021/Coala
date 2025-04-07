from pydantic import BaseModel
from typing import List, Union, Optional

class Section(BaseModel):
    type: str
    style: Optional[str] = None
    content: Union[str, dict, list]
    title: Optional[str] = None
    description: Optional[str] = None
    problem_description: Optional[str] = None

    model_config = {
        "from_attributes": True
    }

class StudyMaterialResponse(BaseModel):
    material_id: int
    title: str
    content: str
    language_id: int
    sections: List[Section]
    is_completed: Optional[bool] = False  # ✅ 학습 완료 여부

    model_config = {
        "from_attributes": True
    }
