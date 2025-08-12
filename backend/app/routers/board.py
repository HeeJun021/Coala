from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.services import board
from app.schemas.board_schema import (
    PostCreate, PostResponse, PostUpdate,
    CommentCreate, CommentResponse,
    PostLikeCreate, CommentLikeCreate,
    PostReportCreate, CommentReportCreate,
    ProjectApplicantCreate, ProjectApplicantResponse
)
from app.services.board import apply_to_project, get_applicants

router = APIRouter(prefix="/board", tags=["Board"])

# 게시글 생성
@router.post("/posts", response_model=PostResponse)
def create_post(post: PostCreate, db: Session = Depends(get_db)):
    return board.create_post(post, db)

# 게시글 목록 (페이징/정렬)
@router.get("/posts/{board_type}", response_model=Dict[str, Any])
def get_posts(
    board_type: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1),
    sort_order: str = Query("최신 순"),
    db: Session = Depends(get_db),
):
    # board.get_posts가 페이징 정보 + 리스트를 dict로 리턴한다고 가정
    return board.get_posts(board_type, page, page_size, sort_order, db)

# 게시글 단건 조회
@router.get("/post/{post_id}", response_model=PostResponse)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = board.get_post(post_id, db)
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    return post

# 게시글 수정 (✅ PostUpdate 사용)
@router.put("/post/{post_id}", response_model=PostResponse)
def update_post(post_id: int, post: PostUpdate, db: Session = Depends(get_db)):
    return board.update_post(post_id, post, db)

# 게시글 삭제
@router.delete("/post/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db)):
    board.delete_post(post_id, db)
    return {"message": "성공적으로 삭제되었습니다."}

# 댓글 작성
@router.post("/post/{post_id}/comment", response_model=CommentResponse)
def create_comment(post_id: int, comment: CommentCreate, db: Session = Depends(get_db)):
    return board.create_comment(post_id, comment, db)

# 댓글 수정 (스키마가 있으면 CommentUpdate 권장)
@router.put("/comment/{comment_id}", response_model=CommentResponse)
def update_comment(comment_id: int, comment: CommentCreate, db: Session = Depends(get_db)):
    return board.update_comment(comment_id, comment, db)

# 댓글 삭제
@router.delete("/comment/{comment_id}")
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    board.delete_comment(comment_id, db)
    return {"message": "댓글 삭제가 완료되었습니다."}

# 댓글 목록
@router.get("/post/{post_id}/comments", response_model=List[CommentResponse])
def get_comments(post_id: int, db: Session = Depends(get_db)):
    return board.get_comments(post_id, db)

# 게시글 좋아요 / 취소 / 확인
@router.post("/post/like")
def like_post(payload: PostLikeCreate, db: Session = Depends(get_db)):
    board.like_post(payload, db)
    return {"message": "성공적으로 좋아요 처리가 되었습니다."}

@router.post("/post/unlike")
def unlike_post(payload: PostLikeCreate, db: Session = Depends(get_db)):
    board.unlike_post(payload, db)
    return {"message": "좋아요가 취소되었습니다."}

@router.get("/post/{post_id}/liked", response_model=Dict[str, bool])
def check_post_liked(post_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    return board.check_post_liked(post_id, user_id, db)

# 게시글/댓글 신고
@router.post("/post/report")
def report_post(payload: PostReportCreate, db: Session = Depends(get_db)):
    board.report_post(payload, db)
    return {"message": "신고가 성공적으로 저장되었습니다."}

@router.post("/comment/report")
def report_comment(payload: CommentReportCreate, db: Session = Depends(get_db)):
    board.report_comment(payload, db)
    return {"message": "신고가 성공적으로 저장되었습니다."}

# 댓글 좋아요 / 취소 / 확인
@router.post("/comment/like")
def like_comment(payload: CommentLikeCreate, db: Session = Depends(get_db)):
    board.like_comment(payload, db)
    return {"message": "댓글 좋아요 등록 완료"}

@router.post("/comment/unlike")
def unlike_comment(payload: CommentLikeCreate, db: Session = Depends(get_db)):
    board.unlike_comment(payload, db)
    return {"message": "댓글 좋아요 취소 완료"}

@router.get("/comment/{comment_id}/liked", response_model=Dict[str, bool])
def check_comment_liked(comment_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    return board.check_comment_liked(comment_id, user_id, db)

# 프로젝트 참여 신청 / 신청자 조회 / 상태 변경
@router.post("/post/{post_id}/apply", response_model=ProjectApplicantResponse)
def apply_project(post_id: int, payload: ProjectApplicantCreate, db: Session = Depends(get_db)):
    try:
        return apply_to_project(post_id, payload, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/post/{post_id}/applicants", response_model=List[ProjectApplicantResponse])
def get_project_applicants(post_id: int, db: Session = Depends(get_db)):
    return get_applicants(post_id, db)

@router.put("/post/applicant/{applicant_id}/status")
def update_applicant_status(applicant_id: int, status: str = Query(...), db: Session = Depends(get_db)):
    return board.update_applicant_status(applicant_id, status, db)

# (선택) 코드 가져오기
@router.post("/post/{post_id}/import_code")
def import_code(post_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    return board.import_code(post_id, user_id, db)

# 내 글/댓글
@router.get("/my/posts", response_model=List[PostResponse])
def get_my_posts(user_id: int = Query(...), db: Session = Depends(get_db)):
    return board.get_my_posts(user_id, db)

@router.get("/my/comments", response_model=List[CommentResponse])
def get_my_comments(user_id: int = Query(...), db: Session = Depends(get_db)):
    return board.get_my_comments(user_id, db)
