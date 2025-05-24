# backend/app/routers/erd_detail.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.erd import (
    Erds,
    ErdTables,
    ErdRelations,
    ErdColumns,
    ErdActivityLogs,
    ErdActivityLogDetails,
)
from app.dependencies.auth import get_current_user
from app.schemas.erd import (
    ErdDetailOut,
    ErdTableCreate,
    ErdTablePartialUpdate,
    ErdTableOut,
    ErdRelationCreate,
    ErdRelationOut,
    ErdColumnCreate,
    ErdColumnPartialUpdate,
    ErdColumnOut,
    ErdBulkDeleteRequest,
    ErdSyncRequest,
)

router = APIRouter(prefix="/erds", tags=["ERD Detail"])


# ERD 상세 조회
@router.get("/{erd_id}", response_model=ErdDetailOut)
def get_erd_detail(erd_id: int, db: Session = Depends(get_db)):
    erd = db.query(Erds).filter(Erds.erd_id == erd_id).first()
    if not erd:
        raise HTTPException(status_code=404, detail="ERD not found")

    return {
        "erd_id": erd.erd_id,
        "name": erd.name,
        "description": erd.description,
        "project_id": erd.project_id,
        "tables": [
            {
                "table_id": t.table_id,
                "name": t.name,
                "description": t.description,
                "pos_x": t.pos_x,
                "pos_y": t.pos_y,
                "columns": [
                    {
                        "column_id": c.column_id,
                        "name": c.name,
                        "data_type": c.data_type,
                        "is_primary": c.is_primary,
                        "is_foreign": c.is_foreign,
                        "is_not_null": c.is_not_null,
                        "default_value": c.default_value,
                        "column_order": c.column_order,
                        "description": c.description,
                    }
                    for c in t.columns
                ],
            }
            for t in erd.tables
        ],
        "relations": [
            {
                "relation_id": r.relation_id,
                "source_table_id": r.source_table_id,
                "source_column_id": r.source_column_id,
                "target_table_id": r.target_table_id,
                "target_column_id": r.target_column_id,
                "relation_type": r.relation_type,
            }
            for r in erd.relations
        ],
    }


# 테이블 추가(이름, 설명 빈칸O)
@router.post("/{erd_id}/tables", response_model=ErdTableOut)
def create_erd_table(erd_id: int, table: ErdTableCreate, db: Session = Depends(get_db)):
    new_table = ErdTables(
        erd_id=erd_id,
        name=table.name or "",
        pos_x=table.pos_x,
        pos_y=table.pos_y,
        description=table.description,
    )
    db.add(new_table)
    db.commit()
    db.refresh(new_table)
    return {
        "id": new_table.table_id,  # ✅ 프론트가 바로 사용 가능
        "table_id": new_table.table_id,
        "name": new_table.name,
        "pos_x": new_table.pos_x,
        "pos_y": new_table.pos_y,
        "description": new_table.description,
        "columns": [],
    }


# 테이블 이름, 설명 수정, 테이블 이동
@router.patch("/{erd_id}/tables/{table_id}")
def update_erd_table_name_or_position(
    erd_id: int,
    table_id: int,
    req: ErdTablePartialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    table = db.query(ErdTables).filter_by(table_id=table_id, erd_id=erd_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="해당 테이블을 찾을 수 없습니다.")

    for field, value in req.dict(exclude_unset=True).items():
        setattr(table, field, value)

    db.commit()
    return {"message": "테이블이 업데이트되었습니다."}


# 테이블 삭제(단일 x 버튼)
@router.delete("/tables/{table_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_table(table_id: int, db: Session = Depends(get_db)):
    table = db.query(ErdTables).filter(ErdTables.table_id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    db.delete(table)
    db.commit()
    return


# 테이블의 컬럼 추가
@router.post("/tables/{table_id}/columns", response_model=ErdColumnOut)
def create_column_for_table(
    table_id: int, column: ErdColumnCreate, db: Session = Depends(get_db)
):
    new_column = ErdColumns(
        table_id=table_id,
        name=column.name or "",
        data_type=column.data_type or "",
        is_primary=column.is_primary,
        is_foreign=column.is_foreign,
        is_not_null=column.is_not_null,
        default_value=column.default_value,
        column_order=column.column_order,
    )
    db.add(new_column)
    db.commit()
    db.refresh(new_column)
    return new_column


# 테이블의 컬럼 변경
@router.patch("/columns/{column_id}")
def update_column(
    column_id: int,
    req: ErdColumnPartialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    column = db.query(ErdColumns).filter_by(column_id=column_id).first()
    if not column:
        raise HTTPException(status_code=404, detail="컬럼을 찾을 수 없습니다.")

    updates = req.dict(exclude_unset=True)
    for key, value in updates.items():
        setattr(column, key, value)

    db.commit()
    return {"message": "컬럼이 업데이트되었습니다."}


# 테이블의 컬럼 삭제
@router.delete("/columns/{column_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_column(column_id: int, db: Session = Depends(get_db)):
    column = db.query(ErdColumns).filter(ErdColumns.column_id == column_id).first()
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")

    db.delete(column)
    db.commit()
    return


# 테이블 간 관계
@router.post(
    "/{erd_id}/relations",
    response_model=ErdRelationOut,
    status_code=status.HTTP_201_CREATED,
)
def create_erd_relation(
    erd_id: int, relation: ErdRelationCreate, db: Session = Depends(get_db)
):
    try:
        new_relation = ErdRelations(
            erd_id=erd_id,
            source_table_id=relation.source_table_id,
            source_column_id=relation.source_column_id,
            target_table_id=relation.target_table_id,
            target_column_id=relation.target_column_id,
            relation_type=relation.relation_type,
            auto_create_fk=getattr(relation, "auto_create_fk", True),
            cascade_delete=getattr(relation, "cascade_delete", False),
        )
        db.add(new_relation)
        db.commit()
        db.refresh(new_relation)

        return ErdRelationOut(
            relation_id=new_relation.relation_id,
            source_table_id=new_relation.source_table_id,
            source_column_id=new_relation.source_column_id,
            target_table_id=new_relation.target_table_id,
            target_column_id=new_relation.target_column_id,
            relation_type=new_relation.relation_type,
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"관계 생성 실패: {str(e)}")


# 다중 삭제
@router.delete("/{erd_id}/bulk-delete", status_code=204)
def bulk_delete_erd_items(
    erd_id: int, req: ErdBulkDeleteRequest, db: Session = Depends(get_db)
):
    # 관계 먼저 삭제
    if req.relation_ids:
        db.query(ErdRelations).filter(
            ErdRelations.relation_id.in_(req.relation_ids),
            ErdRelations.erd_id == erd_id,
        ).delete(synchronize_session=False)

    # 컬럼 삭제
    if req.column_ids:
        db.query(ErdColumns).filter(
            ErdColumns.column_id.in_(req.column_ids),
            ErdColumns.table.has(erd_id=erd_id),  # table 관계 필터
        ).delete(synchronize_session=False)

    # 테이블 삭제
    if req.table_ids:
        db.query(ErdTables).filter(
            ErdTables.table_id.in_(req.table_ids), ErdTables.erd_id == erd_id
        ).delete(synchronize_session=False)

    db.commit()
    return


# 변경사항 있을 시 자동저장
@router.put("/{erd_id}/sync")
def sync_erd_changes(
    erd_id: int,
    req: ErdSyncRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ✅ 테이블 업데이트
    for t in req.updated_tables or []:
        table = (
            db.query(ErdTables).filter_by(table_id=t.table_id, erd_id=erd_id).first()
        )
        if not table:
            continue
        updates = t.dict(exclude_unset=True, exclude={"table_id", "erd_id"})
        for field, value in updates.items():
            setattr(table, field, value)

    # ✅ 컬럼 업데이트
    for c in req.updated_columns or []:
        column = db.query(ErdColumns).filter_by(column_id=c.column_id).first()
        if not column:
            continue
        updates = c.dict(exclude_unset=True, exclude={"column_id"})
        for field, value in updates.items():
            setattr(column, field, value)

    # ✅ 관계 업데이트
    for r in req.updated_relations or []:
        relation = (
            db.query(ErdRelations)
            .filter_by(relation_id=r.relation_id, erd_id=erd_id)
            .first()
        )
        if not relation:
            continue
        updates = r.dict(exclude_unset=True, exclude={"relation_id", "erd_id"})
        for field, value in updates.items():
            setattr(relation, field, value)

    db.commit()
    return {"message": "자동 저장 완료 (로그는 기록되지 않음)."}


# 로그 저장
@router.post("/{erd_id}/commit")
def commit_erd_changes(
    erd_id: int,
    req: ErdSyncRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ✅ 활동 로그 생성
    log = ErdActivityLogs(
        erd_id=erd_id,
        user_id=current_user.user_id,
        action_type="commit",
        target_name=None,
        message="사용자가 수동 저장을 수행했습니다.",
    )
    db.add(log)
    db.flush()  # log_id 확보용

    # ✅ 테이블 변경 로그 기록
    for t in req.updated_tables:
        table = (
            db.query(ErdTables).filter_by(table_id=t.table_id, erd_id=erd_id).first()
        )
        if not table:
            continue
        original = table.__dict__.copy()
        for field, value in t.dict(exclude_unset=True).items():
            before = getattr(table, field)
            if before != value:
                detail = ErdActivityLogDetails(
                    log_id=log.log_id,
                    change_type="update",
                    target_type="table",
                    target_name=table.name,
                    target_field=field,  # ✅ 변경된 필드명 저장
                    before_value=str(before),
                    after_value=str(value),
                )
                db.add(detail)
                setattr(table, field, value)

    # ✅ 컬럼 변경 로그 기록
    for c in req.updated_columns:
        column = db.query(ErdColumns).filter_by(column_id=c.column_id).first()
        if not column:
            continue
        for field, value in c.dict(exclude_unset=True).items():
            before = getattr(column, field)
            if before != value:
                detail = ErdActivityLogDetails(
                    log_id=log.log_id,
                    change_type="update",
                    target_type="column",
                    target_name=column.name,
                    target_field=field,  # ✅ 변경된 필드명 저장
                    before_value=str(before),
                    after_value=str(value),
                )
                db.add(detail)
                setattr(column, field, value)

    # ✅ 관계 변경 로그 기록
    for r in req.updated_relations:
        relation = (
            db.query(ErdRelations)
            .filter_by(relation_id=r.relation_id, erd_id=erd_id)
            .first()
        )
        if not relation:
            continue
        for field, value in r.dict(exclude_unset=True).items():
            before = getattr(relation, field)
            if before != value:
                detail = ErdActivityLogDetails(
                    log_id=log.log_id,
                    change_type="update",
                    target_type="relation",
                    target_name=str(relation.relation_id),
                    target_field=field,  # ✅ 변경된 필드명 저장
                    before_value=str(before),
                    after_value=str(value),
                )
                db.add(detail)
                setattr(relation, field, value)

    db.commit()
    return {"message": "변경 사항이 저장되었고 활동 로그가 기록되었습니다."}