from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, literal, text, literal_column, select, union_all, func, cast
from datetime import date, datetime, timedelta
from app.models.user import User
from app.models.board import PostReport, CommentReport, Post, Comment
from sqlalchemy.types import Date

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
            literal("게시글").label("report_type")
        )
    )

    comment_query = (
        select(
            CommentReport.comment_id.label("target_id"),
            CommentReport.reason,
            CommentReport.user_id,
            CommentReport.created_at.label("created_at"),
            literal("댓글").label("report_type")
        )
    )

    union_stmt = union_all(post_query, comment_query).subquery()

    stmt = select(
        union_stmt.c.target_id,
        union_stmt.c.reason,
        union_stmt.c.user_id,
        union_stmt.c.created_at,
        union_stmt.c.report_type
    ).order_by(desc(union_stmt.c.created_at)).limit(limit)

    results = db.execute(stmt).mappings().all()

    return [
        {
            "type": row["report_type"],
            "target_id": row["target_id"],
            "reason": row["reason"],
            "reporter_id": row["user_id"],
            "created_at": row["created_at"]
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
            "created_at": user.created_at,
            "post_count": post_count,
            "comment_count": comment_count,
            "report_count": total_reports,
            "tier_name": user.tier.tier_name if user.tier else None  
        })

    return results

def get_user_detail_by_id(db: Session, user_id: int):
    # 유저 + 티어 정보
    user = (
        db.query(User)
        .options(joinedload(User.tier))
        .filter(User.user_id == user_id)
        .first()
    )

    if not user:
        return None

    # 해당 유저가 작성한 게시글 목록
    posts = db.query(Post).filter(Post.user_id == user_id).order_by(Post.created_at.desc()).all()

    # 해당 유저가 작성한 댓글 목록
    comments = db.query(Comment).filter(Comment.user_id == user_id).order_by(Comment.created_at.desc()).all()

    # 신고 누적 수 (본인이 작성한 게시글/댓글에 대해 신고된 수)
    post_report_count = (
        db.query(func.count(PostReport.report_id))
        .join(Post, Post.post_id == PostReport.post_id)
        .filter(Post.user_id == user_id)
        .scalar()
    )

    comment_report_count = (
        db.query(func.count(CommentReport.report_id))
        .join(Comment, Comment.comment_id == CommentReport.comment_id)
        .filter(Comment.user_id == user_id)
        .scalar()
    )

    total_report_count = post_report_count + comment_report_count

    return {
        "user": user,
        "posts": posts,
        "comments": comments,
        "report_count": total_report_count,
    }