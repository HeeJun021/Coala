from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import admin_service, question as question_service
from app.schemas.question import QuestionCreate
from app.schemas.admin_user import UserDetailResponse, UserSummary
from app.schemas.board import PostResponse
from app.services.admin_service import get_user_detail_by_id, get_all_users_with_stats
from app.services import board_service
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
        "profile_image_url": user.profile_image_url,
        "created_at": user.created_at,
        "tier": user.tier,
        "report_count": data["report_count"],
        "posts": data["posts"],
        "comments": data["comments"],
    }
        
@router.get("/users", response_model=List[UserSummary])
def get_all_users(db: Session = Depends(get_db)):
    return get_all_users_with_stats(db)

@router.delete("/comments/{comment_id}", response_model=dict)
def admin_delete_comment(comment_id: int, db: Session = Depends(get_db)):
    admin_service.admin_delete_comment(comment_id, db)
    return {"message": "댓글이 삭제되었습니다."}

@router.get("/posts", response_model=List[PostResponse])
def get_all_posts(board_type: str = Query(...), db: Session = Depends(get_db)):
    return admin_service.get_all_posts_by_board(board_type, db)

@router.delete("/posts/{post_id}", response_model=dict)
def admin_delete_post(post_id: int, db: Session = Depends(get_db)):
    board_service.delete_post(post_id, db)
    return {"message": "게시글이 삭제되었습니다."}

# ✅ 학습자료 제목 + 완료 수 조회 라우터 추가
@router.get("/study-materials/summary")
def get_study_material_summary(language: str, db: Session = Depends(get_db)):
    return admin_service.get_study_material_summary_by_language(db, language)

# ✅ 학습자료 삭제 라우터 추가
@router.delete("/study-materials/{material_id}")
def delete_study_material(material_id: int, db: Session = Depends(get_db)):
    return admin_service.delete_study_material(db, material_id)
