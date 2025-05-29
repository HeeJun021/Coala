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
    erd = db.query(Erds).filter_by(erd_id=erd_id).first()
    if not erd:
        raise HTTPException(status_code=404, detail="해당 ERD가 존재하지 않습니다.")

    # ✅ 현재 활성 스냅샷 조회
    current = db.query(ErdSnapshot).filter_by(erd_id=erd_id, is_active=True).first()

    # ✅ Undo 이후 → 미래 스냅샷 제거
    if current:
        db.query(ErdSnapshot).filter(
            ErdSnapshot.erd_id == erd_id,
            ErdSnapshot.created_at > current.created_at
        ).delete()

    # ✅ 기존 스냅샷 비활성화
    db.query(ErdSnapshot).filter_by(erd_id=erd_id, is_active=True).update({"is_active": False})

    # ✅ 새 스냅샷 저장
    snapshot = ErdSnapshot(
        erd_id=erd_id,
        state_json=req.state_json,
        is_active=True
    )
    db.add(snapshot)
    db.commit()

    # ✅ 스냅샷 50개 초과 시 오래된 것 삭제
    snapshots = (
        db.query(ErdSnapshot)
        .filter_by(erd_id=erd_id)
        .order_by(ErdSnapshot.created_at.desc())
        .all()
    )
    if len(snapshots) > 50:
        for s in snapshots[50:]:
            db.delete(s)
        db.commit()

    return {"message": "스냅샷이 저장되었습니다.", "snapshot_id": snapshot.snapshot_id}


# ✅ 2. Undo
@router.post("/{erd_id}/undo")
def undo_erd_snapshot(
    erd_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current = db.query(ErdSnapshot).filter_by(erd_id=erd_id, is_active=True).first()
    if not current:
        raise HTTPException(status_code=404, detail="활성화된 스냅샷이 없습니다.")

    previous = (
        db.query(ErdSnapshot)
        .filter(ErdSnapshot.erd_id == erd_id, ErdSnapshot.created_at < current.created_at)
        .order_by(ErdSnapshot.created_at.desc())
        .first()
    )

    if not previous:
        raise HTTPException(status_code=400, detail="되돌릴 이전 상태가 없습니다.")

    current.is_active = False
    previous.is_active = True
    db.commit()

    return {
        "message": "이전 상태로 되돌렸습니다.",
        "snapshot_id": previous.snapshot_id,
        "state_json": previous.state_json
    }


# ✅ 3. Redo
@router.post("/{erd_id}/redo")
def redo_erd_snapshot(
    erd_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current = db.query(ErdSnapshot).filter_by(erd_id=erd_id, is_active=True).first()
    if not current:
        raise HTTPException(status_code=404, detail="활성화된 스냅샷이 없습니다.")

    next_snapshot = (
        db.query(ErdSnapshot)
        .filter(ErdSnapshot.erd_id == erd_id, ErdSnapshot.created_at > current.created_at)
        .order_by(ErdSnapshot.created_at.asc())
        .first()
    )

    if not next_snapshot:
        raise HTTPException(status_code=400, detail="되돌릴 다음 상태가 없습니다.")

    current.is_active = False
    next_snapshot.is_active = True
    db.commit()

    return {
        "message": "다음 상태로 되돌렸습니다.",
        "snapshot_id": next_snapshot.snapshot_id,
        "state_json": next_snapshot.state_json
    }
