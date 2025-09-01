from pydantic import BaseModel
from enum import Enum
from datetime import datetime

class ActionType(str, Enum):
    quiz_correct = "quiz_correct"
    coding_test_passed = "coding_test_passed"
    daily_attendance = "daily_attendance"
    team_project_complete = "team_project_complete"
    change_profile_image = "change_profile_image"
    
class RewardActionType(str, Enum):
    quiz_correct = "quiz_correct"
    coding_test_passed = "coding_test_passed"
    daily_attendance = "daily_attendance"
    team_project_complete = "team_project_complete"    

class UseActionType(str, Enum):
    change_profile_image = "change_profile_image"

class EucalyptusRewardRequest(BaseModel):
    action: RewardActionType

class EucalyptusUseRequest(BaseModel):
    action: UseActionType

class EucalyptusResponse(BaseModel):
    current_balance: int
    changed_amount: int
    
    
#   트랜잭션 생성 요청용 (내부 로직에서만 사용될 수도 있음)
class EucalyptusTransactionCreate(BaseModel):
    user_id: int
    amount: int
    action: str

#   클라이언트 응답용
class EucalyptusTransactionOut(BaseModel):
    transaction_id: int
    user_id: int
    amount: int
    action: str
    created_at: datetime

    class Config:
        from_attributes = True