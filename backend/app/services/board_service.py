from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.board import (
    Post, Comment,
    PostLike, CommentLike,
    PostReport, CommentReport
)
from app.schemas.board import (
    PostCreate, PostResponse,
    CommentCreate, CommentResponse,
    PostLikeCreate, CommentLikeCreate,
    PostReportCreate, CommentReportCreate
)

# ✅ 게시글 생성
def create_post(post: PostCreate, db: Session):
    new_post = Post(**post.dict())
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

# ✅ 게시글 목록 조회
def get_posts(board_type: str, db: Session):
    return db.query(Post).filter(Post.board_type == board_type).order_by(Post.created_at.desc()).all()

# ✅ 게시글 단건 조회
def get_post(post_id: int, db: Session):
    post = db.query(Post).filter(Post.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    return post

# ✅ 게시글 수정
def update_post(post_id: int, post: PostCreate, db: Session):
    existing_post = db.query(Post).filter(Post.post_id == post_id).first()
    if not existing_post:
        raise HTTPException(status_code=404, detail="게시글이 존재하지 않습니다.")
    for key, value in post.dict().items():
        setattr(existing_post, key, value)
    db.commit()
    db.refresh(existing_post)
    return existing_post

# ✅ 게시글 삭제
def delete_post(post_id: int, db: Session):
    post = db.query(Post).filter(Post.post_id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글이 존재하지 않습니다.")
    db.delete(post)
    db.commit()

# ✅ 댓글 생성
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

# ✅ 댓글 수정
def update_comment(comment_id: int, comment: CommentCreate, db: Session):
    existing_comment = db.query(Comment).filter(Comment.comment_id == comment_id).first()
    if not existing_comment:
        raise HTTPException(status_code=404, detail="댓글이 존재하지 않습니다.")
    existing_comment.content = comment.content
    db.commit()
    db.refresh(existing_comment)
    return existing_comment

# ✅ 댓글 삭제 (자식 댓글도 함께 삭제)
def delete_comment(comment_id: int, db: Session):
    comment = db.query(Comment).filter(Comment.comment_id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="댓글이 존재하지 않습니다.")

    # 🔥 자식 댓글 먼저 삭제
    child_comments = db.query(Comment).filter(Comment.parent_comment_id == comment_id).all()
    for child in child_comments:
        db.delete(child)

    # 🔥 부모 댓글 삭제
    db.delete(comment)
    db.commit()

# ✅ 댓글 조회
def get_comments(post_id: int, db: Session):
    return db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at).all()

# ✅ 게시글 좋아요 등록
def like_post(payload: PostLikeCreate, db: Session):
    existing = db.query(PostLike).filter_by(post_id=payload.post_id, user_id=payload.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 좋아요를 눌렀습니다.")
    db.add(PostLike(**payload.dict()))
    db.commit()

# ✅ 게시글 좋아요 취소
def unlike_post(payload: PostLikeCreate, db: Session):
    like = db.query(PostLike).filter_by(post_id=payload.post_id, user_id=payload.user_id).first()
    if not like:
        raise HTTPException(status_code=404, detail="좋아요 기록이 없습니다.")
    db.delete(like)
    db.commit()

# ✅ 게시글 좋아요 여부 확인
def check_post_liked(post_id: int, user_id: int, db: Session):
    liked = db.query(PostLike).filter_by(post_id=post_id, user_id=user_id).first() is not None
    count = db.query(PostLike).filter_by(post_id=post_id).count()
    return {"liked": liked, "count": count}

# ✅ 댓글 좋아요 등록
def like_comment(payload: CommentLikeCreate, db: Session):
    existing = db.query(CommentLike).filter_by(comment_id=payload.comment_id, user_id=payload.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 좋아요를 눌렀습니다.")
    db.add(CommentLike(**payload.dict()))
    db.commit()

# ✅ 댓글 좋아요 취소
def unlike_comment(payload: CommentLikeCreate, db: Session):
    existing = db.query(CommentLike).filter_by(comment_id=payload.comment_id, user_id=payload.user_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="좋아요 기록이 없습니다.")
    db.delete(existing)
    db.commit()

# ✅ 댓글 좋아요 여부 확인
def check_comment_liked(comment_id: int, user_id: int, db: Session):
    liked = db.query(CommentLike).filter_by(comment_id=comment_id, user_id=user_id).first() is not None
    count = db.query(CommentLike).filter_by(comment_id=comment_id).count()
    return {"liked": liked, "count": count}

# ✅ 게시글 신고
def report_post(payload: PostReportCreate, db: Session):
    existing = db.query(PostReport).filter_by(post_id=payload.post_id, user_id=payload.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 신고한 게시글입니다.")
    db.add(PostReport(**payload.dict()))
    db.commit()

# ✅ 댓글 신고
def report_comment(payload: CommentReportCreate, db: Session):
    existing = db.query(CommentReport).filter_by(comment_id=payload.comment_id, user_id=payload.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 신고한 댓글입니다.")
    db.add(CommentReport(**payload.dict()))
    db.commit()
