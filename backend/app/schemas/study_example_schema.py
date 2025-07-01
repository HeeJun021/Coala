from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any

class StudyExampleResponse(BaseModel):
    example_id: int
    language_id: int
    title: str
    content: str
    sections: Optional[List[Dict[str, Any]]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_completed: Optional[bool] = False  

    model_config = {
        "from_attributes": True
    }
