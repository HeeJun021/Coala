from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any 
from app.database import get_db
from app.services import board_service
from app.schemas.board import (
    PostCreate, PostResponse,
    CommentCreate, CommentResponse,
    PostLikeCreate, CommentLikeCreate,
    PostReportCreate, CommentReportCreate,
    ProjectApplicantCreate, ProjectApplicantResponse
)
from app.services.board_service import apply_to_project, get_applicants

router = APIRouter(prefix="/board", tags=["Board"])

# ✅ 게시글 생성
@router.post("/posts", response_model=PostResponse)
def create_post(post: PostCreate, db: Session = Depends(get_db)):
    print("📥 실제 수신된 post 데이터:", post)
    print("📥 post.dict():", post.dict())
    return board_service.create_post(post, db)

# ✅ 게시글 목록 조회 (페이지네이션 적용)
@router.get("/posts/{board_type}")
def get_posts(
    board_type: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1),
    sort_order: str = Query("최신 순"),
    db: Session = Depends(get_db)
):
    return board_service.get_posts(board_type, page, page_size, sort_order, db)

# ✅ 게시글 단건 조회
@router.get("/post/{post_id}", response_model=PostResponse)
def get_post(post_id: int, db: Session = Depends(get_db)):
    return board_service.get_post(post_id, db)

# ✅ 게시글 수정
@router.put("/post/{post_id}", response_model=PostResponse)
def update_post(post_id: int, post: PostCreate, db: Session = Depends(get_db)):
    return board_service.update_post(post_id, post, db)

# ✅ 게시글 삭제
@router.delete("/post/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db)):
    board_service.delete_post(post_id, db)
    return {"message": "성공적으로 삭제되었습니다."}

# ✅ 댓글 생성
@router.post("/post/{post_id}/comment", response_model=CommentResponse)
def create_comment(post_id: int, comment: CommentCreate, db: Session = Depends(get_db)):
    return board_service.create_comment(post_id, comment, db)

# ✅ 댓글 수정
@router.put("/comment/{comment_id}", response_model=CommentResponse)
def update_comment(comment_id: int, comment: CommentCreate, db: Session = Depends(get_db)):
    return board_service.update_comment(comment_id, comment, db)

# ✅ 댓글 삭제
@router.delete("/comment/{comment_id}")
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    board_service.delete_comment(comment_id, db)
    return {"message": "댓글 삭제가 완료되었습니다."}

# ✅ 댓글 조회
@router.get("/post/{post_id}/comments", response_model=List[CommentResponse])
def get_comments(post_id: int, db: Session = Depends(get_db)):
    return board_service.get_comments(post_id, db)

# ✅ 게시글 좋아요 등록
@router.post("/post/like")
def like_post(payload: PostLikeCreate, db: Session = Depends(get_db)):
    board_service.like_post(payload, db)
    return {"message": "성공적으로 좋아요 처리가 되었습니다."}

# ✅ 게시글 좋아요 취소
@router.post("/post/unlike")
def unlike_post(payload: PostLikeCreate, db: Session = Depends(get_db)):
    board_service.unlike_post(payload, db)
    return {"message": "좋아요가 취소되었습니다."}

# ✅ 게시글 좋아요 여부 확인
@router.get("/post/{post_id}/liked")
def check_post_liked(post_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    return board_service.check_post_liked(post_id, user_id, db)

# ✅ 게시글 신고
@router.post("/post/report")
def report_post(payload: PostReportCreate, db: Session = Depends(get_db)):
    board_service.report_post(payload, db)
    return {"message": "신고가 성공적으로 저장되었습니다."}

# ✅ 댓글 신고
@router.post("/comment/report")
def report_comment(payload: CommentReportCreate, db: Session = Depends(get_db)):
    board_service.report_comment(payload, db)
    return {"message": "신고가 성공적으로 저장되었습니다."}

# ✅ 댓글 좋아요 등록
@router.post("/comment/like")
def like_comment(payload: CommentLikeCreate, db: Session = Depends(get_db)):
    board_service.like_comment(payload, db)
    return {"message": "댓글 좋아요 등록 완료"}

# ✅ 댓글 좋아요 취소
@router.post("/comment/unlike")
def unlike_comment(payload: CommentLikeCreate, db: Session = Depends(get_db)):
    board_service.unlike_comment(payload, db)
    return {"message": "댓글 좋아요 취소 완료"}

# ✅ 댓글 좋아요 여부 확인
@router.get("/comment/{comment_id}/liked")
def check_comment_liked(comment_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    return board_service.check_comment_liked(comment_id, user_id, db)

# ✅ 프로젝트 참여 신청
@router.post("/post/{post_id}/apply", response_model=ProjectApplicantResponse)
def apply_project(post_id: int, payload: ProjectApplicantCreate, db: Session = Depends(get_db)):
    try:
        return apply_to_project(post_id, payload, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ✅ 프로젝트 신청자 목록 조회
@router.get("/post/{post_id}/applicants", response_model=List[ProjectApplicantResponse])
def get_project_applicants(post_id: int, db: Session = Depends(get_db)):
    return get_applicants(post_id, db)

@router.put("/post/applicant/{applicant_id}/status")
def update_applicant_status(applicant_id: int, status: str, db: Session = Depends(get_db)):
    return board_service.update_applicant_status(applicant_id, status, db)

@router.get("/board/{board_type}")
def get_board_list(board_type: str, page: int = 1, sort_order: str = "최신 순", db: Session = Depends(get_db)):
    return board_service.get_posts(board_type, page, 10, sort_order, db)
