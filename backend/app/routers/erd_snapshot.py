from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.erd import Erds, ErdSnapshot, ErdTables, ErdColumns, ErdRelations
from app.routers.erd_detail import get_erd_detail
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/erds", tags=["ERD Snapshots"])


# ✅ 공통 스냅샷 적용 함수
def apply_snapshot_to_db(snapshot_data, erd_id, db: Session):
    # ✅ 1. 기존 테이블 및 컬럼 삭제
    existing_tables = db.query(ErdTables).filter_by(erd_id=erd_id).all()
    existing_table_ids = {t.table_id for t in existing_tables}
    snapshot_table_ids = {t["table_id"] for t in snapshot_data["tables"]}

    for t in existing_tables:
        if t.table_id not in snapshot_table_ids:
            db.query(ErdColumns).filter_by(table_id=t.table_id).delete()
            db.delete(t)
    db.commit()

    # ✅ 2. 테이블 + 컬럼 삽입
    for t_data in snapshot_data["tables"]:
        # 테이블 존재 여부 확인
        t = db.query(ErdTables).filter_by(table_id=t_data["table_id"]).first()
        if not t:
            # 💥 강제 ID 삽입
            db.execute(
                text("""
                    INSERT INTO "erdtables" (table_id, erd_id, name, description, pos_x, pos_y)
                    OVERRIDING SYSTEM VALUE
                    VALUES (:table_id, :erd_id, :name, :description, :pos_x, :pos_y)
                """),
                {
                    "table_id": t_data["table_id"],
                    "erd_id": erd_id,
                    "name": t_data["name"],
                    "description": t_data["description"],
                    "pos_x": t_data["pos_x"],
                    "pos_y": t_data["pos_y"],
                }
            )
        else:
            t.name = t_data["name"]
            t.description = t_data["description"]
            t.pos_x = t_data["pos_x"]
            t.pos_y = t_data["pos_y"]
        db.commit()

        # 컬럼 처리
        existing_columns = db.query(ErdColumns).filter_by(table_id=t_data["table_id"]).all()
        existing_column_ids = {c.column_id for c in existing_columns}
        snapshot_column_ids = {c["column_id"] for c in t_data["columns"]}

        for c in existing_columns:
            if c.column_id not in snapshot_column_ids:
                db.delete(c)

        for c_data in t_data["columns"]:
            c = db.query(ErdColumns).filter_by(column_id=c_data["column_id"]).first()
            if not c:
                db.execute(
                    text("""
                        INSERT INTO "erdcolumns" (
                            column_id, table_id, name, data_type,
                            is_primary, is_foreign, is_not_null,
                            default_value, column_order, description
                        )
                        OVERRIDING SYSTEM VALUE
                        VALUES (
                            :column_id, :table_id, :name, :data_type,
                            :is_primary, :is_foreign, :is_not_null,
                            :default_value, :column_order, :description
                        )
                    """),
                    {
                        **c_data,
                        "table_id": t_data["table_id"],
                    }
                )
            else:
                for field in [
                    "name", "data_type", "is_primary", "is_foreign",
                    "is_not_null", "default_value", "column_order", "description"
                ]:
                    setattr(c, field, c_data[field])
        db.commit()

    # ✅ 3. 관계 재삽입
    db.query(ErdRelations).filter_by(erd_id=erd_id).delete()
    for r in snapshot_data["relations"]:
        # relation_type 키 제거 (안 쓰는 필드니까 안전하게 제외)
        cleaned_r = {k: v for k, v in r.items() if k != "relation_type"}

        db.execute(
            text("""
                INSERT INTO "erdrelations" (
                    relation_id, erd_id, source_table_id, source_column_id,
                    target_table_id, target_column_id,
                    participation_left, participation_right,
                    relation_left, relation_right
                )
                OVERRIDING SYSTEM VALUE
                VALUES (
                    :relation_id, :erd_id, :source_table_id, :source_column_id,
                    :target_table_id, :target_column_id,
                    :participation_left, :participation_right,
                    :relation_left, :relation_right
                )
            """),
            {
                **cleaned_r,
                "erd_id": erd_id
            }
        )
    db.commit()



# ✅ 스냅샷 저장
@router.post("/{erd_id}/snapshots")
def create_erd_snapshot(
    erd_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    erd = db.query(Erds).filter_by(erd_id=erd_id).first()
    if not erd:
        raise HTTPException(status_code=404, detail="해당 ERD가 존재하지 않습니다.")

    current = db.query(ErdSnapshot).filter_by(erd_id=erd_id, is_active=True).first()
    if current:
        # ✅ 현재 snapshot만 비활성화
        db.query(ErdSnapshot).filter_by(erd_id=erd_id, is_active=True).update({"is_active": False})


    erd_detail_data = get_erd_detail(erd_id=erd_id, db=db)

    snapshot = ErdSnapshot(
        erd_id=erd_id,
        state_json=erd_detail_data,
        is_active=True
    )
    db.add(snapshot)
    db.commit()

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


# ✅ Undo
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

    apply_snapshot_to_db(previous.state_json, erd_id, db)

    return {
        "message": "이전 상태로 되돌렸습니다.",
        "snapshot_id": previous.snapshot_id,
        "state_json": previous.state_json,
    }


# ✅ Redo
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

    apply_snapshot_to_db(next_snapshot.state_json, erd_id, db)

    return {
        "message": "다음 상태로 되돌렸습니다.",
        "snapshot_id": next_snapshot.snapshot_id,
        "state_json": next_snapshot.state_json,
    }
