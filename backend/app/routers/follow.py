from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from typing import List
from sqlalchemy import delete
from app.models.user import User, UserFollow
from app.schemas.user import UserSimpleInfo
from app.database import get_db
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/follow", tags=["follow"])


# ✅ 1. 팔로우 하기
@router.post("/{user_id}", status_code=201)
def follow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="자기 자신은 팔로우할 수 없습니다.")

    target_user = db.query(User).filter(User.user_id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="해당 유저를 찾을 수 없습니다.")

    stmt = (
        insert(UserFollow)
        .values(follower_id=current_user.user_id, following_id=user_id)
        .on_conflict_do_nothing()
    )

    db.execute(stmt)
    db.commit()

    return {"message": f"{user_id}번 유저를 팔로우했습니다."}


# ✅ 2. 언팔로우 하기
@router.delete("/{user_id}", status_code=204)
def unfollow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = delete(UserFollow).where(
        UserFollow.follower_id == current_user.user_id,
        UserFollow.following_id == user_id,
    )
    result = db.execute(stmt)
    db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="팔로우하지 않은 유저입니다.")

    return


# ✅ 3. 내가 팔로우한 유저 목록 (팔로잉)
@router.get("/followings", response_model=list[UserSimpleInfo])
def get_followings(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    followings = (
        db.query(User)
        .join(UserFollow, User.user_id == UserFollow.following_id)
        .filter(UserFollow.follower_id == current_user.user_id)
        .all()
    )

    return [
        UserSimpleInfo(
            user_id=u.user_id, nickname=u.nickname, profile_image=u.profile_image_url
        )
        for u in followings
    ]


# ✅ 4. 나를 팔로우한 유저 목록 (팔로워)
@router.get("/followers", response_model=list[UserSimpleInfo])
def get_followers(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    followers = (
        db.query(User)
        .join(UserFollow, User.user_id == UserFollow.follower_id)
        .filter(UserFollow.following_id == current_user.user_id)
        .all()
    )

    return [
        UserSimpleInfo(
            user_id=u.user_id, nickname=u.nickname, profile_image=u.profile_image_url
        )
        for u in followers
    ]

# 🔍 전체 유저 검색 API
@router.get("/search", response_model=list[UserSimpleInfo])
def search_users(
    keyword: str = Query("", alias="keyword"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.user_id != current_user.user_id)

    if keyword:
        query = query.filter(User.nickname.ilike(f"%{keyword}%"))

    users = query.order_by(User.nickname.asc()).limit(50).all()

    return [
        UserSimpleInfo(
            user_id=u.user_id,
            nickname=u.nickname,
            profile_image=u.profile_image_url,
        )
        for u in users
    ]


# 추천친구 검색
@router.get("/recommended", response_model=list[UserSimpleInfo])
def get_recommended_users(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    # 내가 팔로우하는 사람
    followings = (
        db.query(User.user_id)
        .join(UserFollow, User.user_id == UserFollow.following_id)
        .filter(UserFollow.follower_id == current_user.user_id)
    )

    # 나를 팔로우하는 사람
    followers = (
        db.query(User.user_id)
        .join(UserFollow, User.user_id == UserFollow.follower_id)
        .filter(UserFollow.following_id == current_user.user_id)
    )

    # 둘 다 합치고 distinct
    union_subq = followings.union(followers).subquery()

    users = (
        db.query(User)
        .filter(User.user_id.in_(db.query(union_subq)))
        .filter(User.user_id != current_user.user_id)
        .all()
    )

    return [
        UserSimpleInfo(
            user_id=u.user_id, nickname=u.nickname, profile_image=u.profile_image_url
        )
        for u in users
    ]
