from pydantic import BaseModel
from enum import Enum

class ActionType(str, Enum):
    quiz_correct = "quiz_correct"
    coding_test_passed = "coding_test_passed"
    daily_login = "daily_login"
    team_project_complete = "team_project_complete"

class EucalyptusRewardRequest(BaseModel):
    action: ActionType

class EucalyptusUseRequest(BaseModel):
    action: str

class EucalyptusResponse(BaseModel):
    current_balance: int
    changed_amount: int