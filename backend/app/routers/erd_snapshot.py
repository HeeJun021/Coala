from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.erd import Erds, ErdSnapshot
from app.schemas.erd import ErdSnapshotCreate
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/erds", tags=["ERD Snapshots"])


# ✅ 1. 스냅샷 저장
@router.post("/{erd_id}/snapshots")
def create_erd_snapshot(
    erd_id: int,
    req: ErdSnapshotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. ERD 존재 여부 확인
    erd = db.query(Erds).filter_by(erd_id=erd_id).first()
    if not erd:
        raise HTTPException(status_code=404, detail="해당 ERD가 존재하지 않습니다.")

    # 2. 현재 활성 스냅샷 비활성화
    db.query(ErdSnapshot).filter_by(erd_id=erd_id, is_active=True).update({"is_active": False})

    # 3. 새 스냅샷 저장
    snapshot = ErdSnapshot(
        erd_id=erd_id,
        state_json=req.state_json,
        is_active=True  # 이게 최신 상태임
    )
    db.add(snapshot)
    db.commit()

    return {"message": "스냅샷이 저장되었습니다.", "snapshot_id": snapshot.snapshot_id}


# ✅ 2. Undo (이전 상태로 되돌리기)
@router.post("/{erd_id}/undo")
def undo_erd_snapshot(
    erd_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. 현재 스냅샷 찾기
    current = db.query(ErdSnapshot).filter_by(erd_id=erd_id, is_active=True).first()
    if not current:
        raise HTTPException(status_code=404, detail="활성화된 스냅샷이 없습니다.")

    # 2. 이전 스냅샷 찾기 (시간 순으로 한 단계 전)
    previous = (
        db.query(ErdSnapshot)
        .filter(
            ErdSnapshot.erd_id == erd_id,
            ErdSnapshot.created_at < current.created_at
        )
        .order_by(ErdSnapshot.created_at.desc())
        .first()
    )

    if not previous:
        raise HTTPException(status_code=400, detail="되돌릴 이전 상태가 없습니다.")

    # 3. 스냅샷 전환
    current.is_active = False
    previous.is_active = True
    db.commit()

    return {
        "message": "이전 상태로 되돌렸습니다.",
        "snapshot_id": previous.snapshot_id,
        "state_json": previous.state_json
    }


# ✅ 3. Redo (앞으로 이동)
@router.post("/{erd_id}/redo")
def redo_erd_snapshot(
    erd_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. 현재 활성화된 스냅샷 찾기
    current = db.query(ErdSnapshot).filter_by(erd_id=erd_id, is_active=True).first()
    if not current:
        raise HTTPException(status_code=404, detail="활성화된 스냅샷이 없습니다.")

    # 2. 다음 스냅샷 찾기 (시간 순으로 한 단계 후)
    next_snapshot = (
        db.query(ErdSnapshot)
        .filter(
            ErdSnapshot.erd_id == erd_id,
            ErdSnapshot.created_at > current.created_at
        )
        .order_by(ErdSnapshot.created_at.asc())
        .first()
    )

    if not next_snapshot:
        raise HTTPException(status_code=400, detail="되돌릴 다음 상태가 없습니다.")

    # 3. 스냅샷 전환
    current.is_active = False
    next_snapshot.is_active = True
    db.commit()

    return {
        "message": "다음 상태로 되돌렸습니다.",
        "snapshot_id": next_snapshot.snapshot_id,
        "state_json": next_snapshot.state_json
    }
