from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, literal, text, literal_column, select, union_all, func, cast
from datetime import date, datetime, timedelta
from app.models.user import User
from app.models.board import PostReport, CommentReport, Post, Comment, PostLike
from app.models.language import Language
from app.models.study_materials import StudyMaterials
from app.models.studymaterialread import studymaterialreads
from sqlalchemy.types import Date
from app.schemas.board import PostResponse

def get_dashboard_summary(db: Session) -> dict:
    user_count = db.query(func.count(User.user_id)).scalar()
    post_count = db.query(func.count(Post.post_id)).scalar()
    comment_count = db.query(func.count(Comment.comment_id)).scalar()

    today = date.today()
    today_post_reports = db.query(func.count(PostReport.report_id)).filter(func.date(PostReport.created_at) == today).scalar()
    today_comment_reports = db.query(func.count(CommentReport.report_id)).filter(func.date(CommentReport.created_at) == today).scalar()

    return {
        "user_count": user_count,
        "post_count": post_count,
        "comment_count": comment_count,
        "today_reports": today_post_reports + today_comment_reports
    }

def get_recent_reports(db: Session, limit: int = 10):
    post_query = (
        select(
            PostReport.post_id.label("target_id"),
            PostReport.reason,
            PostReport.user_id,
            PostReport.created_at.label("created_at"),
            literal("게시글").label("report_type"),
            PostReport.post_id.label("post_id")  # ✅ 게시글 ID 그대로
        )
    )

    comment_query = (
        select(
            CommentReport.comment_id.label("target_id"),
            CommentReport.reason,
            CommentReport.user_id,
            CommentReport.created_at.label("created_at"),
            literal("댓글").label("report_type"),
            Comment.post_id.label("post_id")  # ✅ 댓글 → 게시글 ID join으로 추출
        ).join(Comment, Comment.comment_id == CommentReport.comment_id)
    )

    union_stmt = union_all(post_query, comment_query).subquery()

    stmt = select(
        union_stmt.c.target_id,
        union_stmt.c.reason,
        union_stmt.c.user_id,
        union_stmt.c.created_at,
        union_stmt.c.report_type,
        union_stmt.c.post_id  # ✅ 포함된 post_id까지 함께
    ).order_by(desc(union_stmt.c.created_at)).limit(limit)

    results = db.execute(stmt).mappings().all()

    return [
        {
            "type": row["report_type"],
            "target_id": row["target_id"],
            "reason": row["reason"],
            "reporter_id": row["user_id"],
            "created_at": row["created_at"],
            "post_id": row["post_id"]  # ✅ 프론트에서 사용하는 postId
        }
        for row in results
    ]
    
def get_weekly_report_trend(db: Session):
    today = datetime.utcnow().date()
    seven_days_ago = today - timedelta(days=6)

    # 📌 날짜별 게시글 신고 수
    post_counts = (
        db.query(
            cast(PostReport.created_at, Date).label("date"),
            func.count(PostReport.report_id).label("count")
        )
        .filter(cast(PostReport.created_at, Date) >= seven_days_ago)
        .group_by(cast(PostReport.created_at, Date))
        .all()
    )

    # 📌 날짜별 댓글 신고 수
    comment_counts = (
        db.query(
            cast(CommentReport.created_at, Date).label("date"),
            func.count(CommentReport.report_id).label("count")
        )
        .filter(cast(CommentReport.created_at, Date) >= seven_days_ago)
        .group_by(cast(CommentReport.created_at, Date))
        .all()
    )

    # 📌 날짜별 합산
    date_to_count = {}

    for row in post_counts:
        date_to_count[row.date] = date_to_count.get(row.date, 0) + row.count
    for row in comment_counts:
        date_to_count[row.date] = date_to_count.get(row.date, 0) + row.count

    # 지난 7일 데이터 생성 (누락된 날짜 0으로 채움)
    result = []
    for i in range(7):
        day = seven_days_ago + timedelta(days=i)
        count = date_to_count.get(day, 0)
        result.append({
            "date": day.strftime("%m-%d"),  # 예: "05-18"
            "reports": count
        })

    return result

def get_all_users_with_stats(db: Session):
    users = (
        db.query(User)
        .options(joinedload(User.tier)) 
        .all()
    )

    results = []
    for user in users:
        post_count = db.query(func.count()).select_from(Post).filter(Post.user_id == user.user_id).scalar()
        comment_count = db.query(func.count()).select_from(Comment).filter(Comment.user_id == user.user_id).scalar()

        post_report_count = (
            db.query(func.count(PostReport.report_id))
            .join(Post, Post.post_id == PostReport.post_id)
            .filter(Post.user_id == user.user_id)
            .scalar()
        )

        comment_report_count = (
            db.query(func.count(CommentReport.report_id))
            .join(Comment, Comment.comment_id == CommentReport.comment_id)
            .filter(Comment.user_id == user.user_id)
            .scalar()
        )

        total_reports = post_report_count + comment_report_count

        results.append({
            "user_id": user.user_id,
            "nickname": user.nickname,
            "email": user.email,
            "profile_image_url": user.profile_image_url,
            "created_at": user.created_at,
            "post_count": post_count,
            "comment_count": comment_count,
            "report_count": total_reports,
            "tier_name": user.tier.tier_name if user.tier else None  
        })

    return results

def get_user_detail_by_id(db: Session, user_id: int):
    # 1) 유저 + 티어
    user = (
        db.query(User)
        .options(joinedload(User.tier))
        .filter(User.user_id == user_id)
        .first()
    )
    if not user:
        return None

    # 2) 게시글 목록
    posts = db.query(Post) \
        .filter(Post.user_id == user_id) \
        .order_by(Post.created_at.desc()) \
        .all()

    # 3) 댓글 목록(제목 포함)
    comments = (
        db.query(Comment)
        .options(joinedload(Comment.post))                # ← 여기!
        .filter(Comment.user_id == user_id)
        .order_by(Comment.created_at.desc())
        .all()
    )
    comment_list = []
    for c in comments:
        comment_list.append({
            "comment_id":   c.comment_id,
            "content":      c.content,
            "created_at":   c.created_at,
            "post_id":      c.post_id,
            "post_title":   c.post.title or "(삭제된 게시글)",  # lazy‐load 된 Post.title
        })

    # 4) 신고 카운트
    post_rpt_cnt = (
        db.query(func.count(PostReport.report_id))
        .join(Post, Post.post_id == PostReport.post_id)
        .filter(Post.user_id == user_id)
        .scalar()
    )
    comment_rpt_cnt = (
        db.query(func.count(CommentReport.report_id))
        .join(Comment, Comment.comment_id == CommentReport.comment_id)
        .filter(Comment.user_id == user_id)
        .scalar()
    )
    total_reports = post_rpt_cnt + comment_rpt_cnt

    return {
        "user":         user,
        "profile_image_url": user.profile_image_url,
        "posts":        posts,
        "comments":     comment_list,
        "report_count": total_reports,
    }
    
def admin_delete_comment(comment_id: int, db: Session):
    comment = db.query(Comment).filter(Comment.comment_id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="댓글이 존재하지 않습니다.")

    comment.content = "삭제된 댓글입니다."
    db.commit()
    
def get_all_posts_by_board(board_type: str, db: Session):
    like_subq = db.query(
        PostLike.post_id,
        func.count(PostLike.user_id).label("like_count")
    ).group_by(PostLike.post_id).subquery()

    comment_subq = db.query(
        Comment.post_id,
        func.count(Comment.comment_id).label("comment_count")
    ).group_by(Comment.post_id).subquery()

    posts = (
        db.query(
            Post,
            User.nickname.label("author_nickname"),
            func.coalesce(like_subq.c.like_count, 0).label("like_count"),
            func.coalesce(comment_subq.c.comment_count, 0).label("comment_count")
        )
        .join(User, Post.user_id == User.user_id)
        .outerjoin(like_subq, Post.post_id == like_subq.c.post_id)
        .outerjoin(comment_subq, Post.post_id == comment_subq.c.post_id)
        .filter(Post.board_type == board_type)
        .order_by(Post.created_at.desc())
        .all()
    )

    result = []
    for post, nickname, like_count, comment_count in posts:
        post_data = PostResponse.model_validate(post).model_dump()
        post_data["author_nickname"] = nickname
        post_data["like_count"] = like_count
        post_data["comment_count"] = comment_count
        result.append(post_data)

    return result

def get_study_material_summary_by_language(db: Session, language: str):
    language_obj = db.query(Language).filter(Language.language == language).first()
    if not language_obj:
        raise HTTPException(status_code=404, detail="해당 언어를 찾을 수 없습니다.")

    results = (
        db.query(
            StudyMaterials.material_id,
            StudyMaterials.title,
            func.count().label("read_count")
        )
        .outerjoin(studymaterialreads, StudyMaterials.material_id == studymaterialreads.material_id)
        .filter(StudyMaterials.language_id == language_obj.language_id)
        .group_by(StudyMaterials.material_id)
        .all()
    )

    return [
        {"material_id": r.material_id, "title": r.title, "read_count": r.read_count}
        for r in results
    ]
    
# ✅ 학습자료 삭제
def delete_study_material(db: Session, material_id: int):
    material = db.query(StudyMaterials).filter(StudyMaterials.material_id == material_id).first()
    if not material:
        raise ValueError("해당 학습자료를 찾을 수 없습니다.")
    db.delete(material)
    db.commit()
    return {"message": "학습자료가 삭제되었습니다."}