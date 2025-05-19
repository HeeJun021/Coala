from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import admin_service, question as question_service
from app.schemas.question import QuestionCreate
from app.schemas.admin_user import UserDetailResponse, UserSummary
from app.services.admin_service import get_user_detail_by_id, get_all_users_with_stats
from typing import List

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    return admin_service.get_dashboard_summary(db)

@router.get("/reports/recent")
def get_recent_reports(db: Session = Depends(get_db)):
    return admin_service.get_recent_reports(db)

@router.get("/reports/weekly")
def get_weekly_report_trend(db: Session = Depends(get_db)):
    return admin_service.get_weekly_report_trend(db)

@router.post("/questions/create", response_model=dict)
def create_question(payload: QuestionCreate, db: Session = Depends(get_db)):
    created_question = question_service.create_question(db, payload)
    return {"message": "문제가 성공적으로 생성되었습니다.", "question_id": created_question.question_id}

@router.delete("/questions/{question_id}", response_model=dict)
def delete_question(question_id: int, db: Session = Depends(get_db)):
    success = question_service.delete_question(db, question_id)
    if not success:
        raise HTTPException(status_code=404, detail="해당 문제를 찾을 수 없습니다.")
    return {"message": f"문제 {question_id}가 성공적으로 삭제되었습니다."}

@router.get("/users/{user_id}", response_model=UserDetailResponse)
def get_user_detail(user_id: int, db: Session = Depends(get_db)):
    data = get_user_detail_by_id(db, user_id)
    if not data:
        raise HTTPException(status_code=404, detail="해당 사용자를 찾을 수 없습니다.")
    
    user = data["user"]
    return {
        "user_id": user.user_id,
        "nickname": user.nickname,
        "email": user.email,
        "created_at": user.created_at,
        "tier": user.tier,
        "report_count": data["report_count"],
        "posts": data["posts"],
        "comments": data["comments"],
    }
    
    
@router.get("/users", response_model=List[UserSummary])
def get_all_users(db: Session = Depends(get_db)):
    return get_all_users_with_stats(db)