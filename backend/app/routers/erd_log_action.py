from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.database import get_db
from app.models.erd_models import (
    ErdActivityLogs,
    ErdActivityLogDetails,
    ErdTables,
    ErdColumns,
    ErdRelations,
)
from app.models.user import User
from app.dependencies.auth import get_current_user

router = APIRouter(tags=["ERD Actions"])

# Undo: 마지막 변경을 되돌리기
@router.post("/erds/{erd_id}/__log_undo")
def undo_last_erd_change(
    erd_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    last_log = (
        db.query(ErdActivityLogs)
        .filter_by(erd_id=erd_id, undone=False)
        .order_by(ErdActivityLogs.created_at.desc())
        .first()
    )

    if not last_log:
        print("[UNDO] 되돌릴 수 있는 로그가 없습니다. erd_id =", erd_id)
        raise HTTPException(status_code=400, detail="되돌릴 수 있는 로그가 없습니다.")


    details = db.query(ErdActivityLogDetails).filter_by(log_id=last_log.log_id).all()

    for detail in details:
        if detail.target_type == "table":
            table = db.query(ErdTables).filter(
                and_(
                    ErdTables.name == detail.target_name,
                    ErdTables.erd_id == erd_id,
                )
            ).first()
            if table:
                setattr(table, detail.target_field, detail.before_value)

        elif detail.target_type == "column":
            column = (
                db.query(ErdColumns)
                .join(ErdTables, ErdColumns.table_id == ErdTables.table_id)
                .filter(
                    ErdColumns.name == detail.target_name,
                    ErdTables.erd_id == erd_id,
                )
                .first()
            )
            if column:
                setattr(column, detail.target_field, detail.before_value)

        elif detail.target_type == "relation":
            relation = db.query(ErdRelations).filter(
                and_(
                    ErdRelations.relation_id == int(detail.target_name),
                    ErdRelations.erd_id == erd_id,
                )
            ).first()
            if relation:
                setattr(relation, detail.target_field, detail.before_value)

    last_log.undone = True
    db.commit()

    return {"message": f"{last_log.log_id}번 로그가 되돌려졌습니다."}


# Redo: 마지막 Undo를 다시 실행
@router.post("/erds/{erd_id}/__log_redo")
def redo_last_undone_change(
    erd_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    last_log = (
        db.query(ErdActivityLogs)
        .filter_by(erd_id=erd_id, undone=True)
        .order_by(ErdActivityLogs.created_at.desc())
        .first()
    )

    if not last_log:
        print("❌ [REDO] 다시 실행할 수 있는 로그가 없습니다. erd_id =", erd_id)
        raise HTTPException(status_code=400, detail="다시 실행할 수 있는 로그가 없습니다.")


    details = db.query(ErdActivityLogDetails).filter_by(log_id=last_log.log_id).all()

    for detail in details:
        if detail.target_type == "table":
            table = db.query(ErdTables).filter(
                and_(
                    ErdTables.name == detail.target_name,
                    ErdTables.erd_id == erd_id,
                )
            ).first()
            if table:
                setattr(table, detail.target_field, detail.after_value)

        elif detail.target_type == "column":
            column = (
                db.query(ErdColumns)
                .join(ErdTables, ErdColumns.table_id == ErdTables.table_id)
                .filter(
                    ErdColumns.name == detail.target_name,
                    ErdTables.erd_id == erd_id,
                )
                .first()
            )
            if column:
                setattr(column, detail.target_field, detail.after_value)

        elif detail.target_type == "relation":
            relation = db.query(ErdRelations).filter(
                and_(
                    ErdRelations.relation_id == int(detail.target_name),
                    ErdRelations.erd_id == erd_id,
                )
            ).first()
            if relation:
                setattr(relation, detail.target_field, detail.after_value)

    last_log.undone = False
    db.commit()

    return {"message": f"{last_log.log_id}번 로그가 다시 적용되었습니다."}
