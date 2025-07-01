from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import update
from app.database import get_db
from app.models.erd_models import Erds, ErdSnapshot, ErdActivityLogs
from app.routers.erd_detail import get_erd_detail
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/erds", tags=["ERD Snapshots"])


@router.post("/{erd_id}/commit")
def commit_erd_snapshot(
    erd_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1️ERD 존재 여부 확인
    erd = db.query(Erds).filter_by(erd_id=erd_id).first()
    if not erd:
        raise HTTPException(status_code=404, detail="해당 ERD가 존재하지 않습니다.")

    # 2️활동 로그 생성
    log = ErdActivityLogs(
        erd_id=erd_id,
        user_id=current_user.user_id,
        action_type="commit",
        target_name=None,
        message="사용자가 수동 저장을 수행했습니다.",
    )
    db.add(log)
    db.flush()  # log_id 확보

    # 3️기존 커밋 스냅샷 비활성화 처리
    db.query(ErdSnapshot).filter_by(erd_id=erd_id, is_active=True).update(
        {"is_active": False}
    )
    db.commit()

    # 현재 상태 스냅샷 저장
    erd_detail_data = get_erd_detail(erd_id=erd_id, db=db)

    snapshot = ErdSnapshot(
        erd_id=erd_id,
        state_json=erd_detail_data,
        is_active=True,
        log_id=log.log_id,        # 로그 연결
        source="commit",          # 커밋 스냅샷임을 명시
    )
    db.add(snapshot)
    db.commit()

    # 5️커밋 스냅샷 50개 초과 시 삭제
    snapshots = (
        db.query(ErdSnapshot)
        .filter(ErdSnapshot.erd_id == erd_id, ErdSnapshot.source == "commit")
        .order_by(ErdSnapshot.created_at.desc())
        .all()
    )
    if len(snapshots) > 50:
        for s in snapshots[50:]:
            db.delete(s)
        db.commit()

    return {"message": "커밋 스냅샷이 저장되었습니다.", "snapshot_id": snapshot.snapshot_id}
