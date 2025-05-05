from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.board import (
    Post, Comment,
    PostLike, CommentLike,
    PostReport, CommentReport,
    ProjectApplicant
)
from app.models.user import User  # ✅ User 모델 추가
from app.schemas.board import (
    PostCreate, PostResponse,
    CommentCreate, CommentResponse,
    PostLikeCreate, CommentLikeCreate,
    PostReportCreate, CommentReportCreate,
    ProjectApplicantCreate, ProjectApplicantResponse
)

# 포스트 생성
def create_post(post: PostCreate, db: Session):
    new_post = Post(**post.dict())
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

# 포스트 목록 조회 (페이지네이션 적용 + 좋아요/댓글수 계산)
def get_posts(board_type: str, page: int, page_size: int, sort_order: str, db: Session):
    like_subq = db.query(
        PostLike.post_id, func.count(PostLike.user_id).label("like_count")
    ).group_by(PostLike.post_id).subquery()

    comment_subq = db.query(
        Comment.post_id, func.count(Comment.comment_id).label("comment_count")
    ).group_by(Comment.post_id).subquery()
    
    accepted_subq = db.query(
    ProjectApplicant.post_id, func.count().label("accepted_count")
    ).filter(ProjectApplicant.status == "수락").group_by(ProjectApplicant.post_id).subquery()

    base_query = db.query(Post).filter(Post.board_type == board_type)
    total = base_query.count()

    query = db.query(
        Post,
        func.coalesce(like_subq.c.like_count, 0).label("like_count"),
        func.coalesce(comment_subq.c.comment_count, 0).label("comment_count"),
        func.coalesce(accepted_subq.c.accepted_count, 1).label("accepted_count")  # ✅ 모집 인원 필드 추가
    ).outerjoin(like_subq, Post.post_id == like_subq.c.post_id) \
    .outerjoin(comment_subq, Post.post_id == comment_subq.c.post_id) \
    .outerjoin(accepted_subq, Post.post_id == accepted_subq.c.post_id) \
    .filter(Post.board_type == board_type)
    # 정렬 기준 적용
    if sort_order == "좋아요 많은 순":
        query = query.order_by(func.coalesce(like_subq.c.like_count, 0).desc(), Post.created_at.desc())
    elif sort_order == "댓글 많은 순":
        query = query.order_by(func.coalesce(comment_subq.c.comment_count, 0).desc(), Post.created_at.desc())
    else:  # 최신 순
        query = query.order_by(Post.created_at.desc())

    posts = query.offset((page - 1) * page_size).limit(page_size).all()

    result = []
    for post, like_count, comment_count, accepted_count in posts:
        post_data = PostResponse.model_validate(post).model_dump()
        post_data["like_count"] = like_count
        post_data["comment_count"] = comment_count
        post_data["accepted_count"] = accepted_count
        post_data["recruit_limit"] = post.recruit_limit  # ✅ Post 모델에서 바로 가져옴
        result.append(post_data)


    return {"posts": result, "total": total}

# 포스트 단건 조회 (작성자 닉네임 포함)
def get_post(post_id: int, db: Session):
    post_query = db.query(Post, User.nickname).join(User, Post.user_id == User.user_id).filter(Post.post_id == post_id).first()
    if not post_query:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")

    post, nickname = post_query
    result = PostResponse.model_validate(post).model_dump()
    result["author_nickname"] = nickname  # ✅ 닉네임 추가
    return result

# 포스트 수정
def update_post(post_id: int, post: PostCreate, db: Session):
    existing_post = db.query(Post).filter(Post.post_id == post_id).first()
    if not existing_post:
        raise HTTPException(status_code=404, detail="게시글이 존재하지 않습니다.")
    for key, value in post.dict().items():
        setattr(existing_post, key, value)
    db.commit()
    db.refresh(existing_post)
    return existing_post

# 포스트 삭제
def delete_post(post_id: int, db: Session):
    post = db.query(Post).filter(Post.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글이 존재하지 않습니다.")
    db.delete(post)
    db.commit()

# 댓글 생성
def create_comment(post_id: int, comment: CommentCreate, db: Session):
    new_comment = Comment(
        post_id=post_id,
        user_id=comment.user_id,
        content=comment.content,
        parent_comment_id=comment.parent_comment_id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

# 댓글 수정
def update_comment(comment_id: int, comment: CommentCreate, db: Session):
    existing_comment = db.query(Comment).filter(Comment.comment_id == comment_id).first()
    if not existing_comment:
        raise HTTPException(status_code=404, detail="댓글이 존재하지 않습니다.")
    existing_comment.content = comment.content
    db.commit()
    db.refresh(existing_comment)
    return existing_comment

# 댓글 삭제
def delete_comment(comment_id: int, db: Session):
    comment = db.query(Comment).filter(Comment.comment_id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="댓글이 존재하지 않습니다.")
    child_comments = db.query(Comment).filter(Comment.parent_comment_id == comment_id).all()
    for child in child_comments:
        db.delete(child)
    db.delete(comment)
    db.commit()

# 댓글 조회
def get_comments(post_id: int, db: Session):
    return db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at).all()

# 포스트 좋아요 등록
def like_post(payload: PostLikeCreate, db: Session):
    existing = db.query(PostLike).filter_by(post_id=payload.post_id, user_id=payload.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 좋아요를 누른 상황입니다.")
    db.add(PostLike(**payload.dict()))
    db.commit()

# 포스트 좋아요 취소
def unlike_post(payload: PostLikeCreate, db: Session):
    like = db.query(PostLike).filter_by(post_id=payload.post_id, user_id=payload.user_id).first()
    if not like:
        raise HTTPException(status_code=404, detail="좋아요 기록이 없습니다.")
    db.delete(like)
    db.commit()

# 포스트 좋아요 조회
def check_post_liked(post_id: int, user_id: int, db: Session):
    liked = db.query(PostLike).filter_by(post_id=post_id, user_id=user_id).first() is not None
    count = db.query(PostLike).filter_by(post_id=post_id).count()
    return {"liked": liked, "count": count}

# 댓글 좋아요 등록
def like_comment(payload: CommentLikeCreate, db: Session):
    existing = db.query(CommentLike).filter_by(comment_id=payload.comment_id, user_id=payload.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 좋아요를 누른 상황입니다.")
    db.add(CommentLike(**payload.dict()))
    db.commit()

# 댓글 좋아요 취소
def unlike_comment(payload: CommentLikeCreate, db: Session):
    existing = db.query(CommentLike).filter_by(comment_id=payload.comment_id, user_id=payload.user_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="좋아요 기록이 없습니다.")
    db.delete(existing)
    db.commit()

# 댓글 좋아요 조회
def check_comment_liked(comment_id: int, user_id: int, db: Session):
    liked = db.query(CommentLike).filter_by(comment_id=comment_id, user_id=user_id).first() is not None
    count = db.query(CommentLike).filter_by(comment_id=comment_id).count()
    return {"liked": liked, "count": count}

# 포스트 신고
def report_post(payload: PostReportCreate, db: Session):
    existing = db.query(PostReport).filter_by(post_id=payload.post_id, user_id=payload.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 신고한 게시글입니다.")
    db.add(PostReport(**payload.dict()))
    db.commit()

# 댓글 신고
def report_comment(payload: CommentReportCreate, db: Session):
    existing = db.query(CommentReport).filter_by(comment_id=payload.comment_id, user_id=payload.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 신고한 댓글입니다.")
    db.add(CommentReport(**payload.dict()))
    db.commit()

def apply_to_project(post_id: int, data: ProjectApplicantCreate, db: Session):
    exists = db.query(ProjectApplicant).filter_by(post_id=post_id, user_id=data.user_id).first()
    if exists:
        raise HTTPException(status_code=400, detail="이미 신청하셨습니다.")

    new_applicant = ProjectApplicant(
        post_id=post_id,
        user_id=data.user_id,
        introduction=data.introduction,
        skills=",".join(data.skills),
        links=data.links,
    )
    db.add(new_applicant)
    db.commit()
    db.refresh(new_applicant)

    # ✅ 닉네임을 가져오기 위한 유저 조회 추가
    user = db.query(User).filter(User.user_id == new_applicant.user_id).first()

    return ProjectApplicantResponse(
        applicant_id=new_applicant.applicant_id,
        user_id=new_applicant.user_id,
        nickname=user.nickname,  # ✅ 이제 인식됩니다
        introduction=new_applicant.introduction,
        skills=new_applicant.skills.split(",") if new_applicant.skills else [],
        links=new_applicant.links,
        status=new_applicant.status,
        applied_at=new_applicant.applied_at,
    )


def get_applicants(post_id: int, db: Session):
    results = (
        db.query(ProjectApplicant, User.nickname)
        .join(User, ProjectApplicant.user_id == User.user_id)
        .filter(ProjectApplicant.post_id == post_id)
        .all()
    )

    return [
        ProjectApplicantResponse(
            applicant_id=app.applicant_id,
            user_id=app.user_id,
            nickname=nickname,
            introduction=app.introduction,
            skills=app.skills.split(",") if app.skills else [],
            links=app.links,
            status=app.status,
            applied_at=app.applied_at,
        )
        for app, nickname in results
    ]

def update_applicant_status(applicant_id: int, status: str, db: Session):
    applicant = db.query(ProjectApplicant).filter_by(applicant_id=applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="지원자를 찾을 수 없습니다.")
    applicant.status = status
    db.commit()
    return {"message": f"상태가 '{status}'로 변경되었습니다."}

# 수락된 지원자 수 조회 함수
def get_accepted_count(post_id: int, db: Session):
    return db.query(ProjectApplicant).filter_by(post_id=post_id, status="수락").count()
