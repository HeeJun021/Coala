from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Literal
from app.database import get_db
from app.models.erd import Erds, ErdTables, ErdColumns, ErdRelations
from app.schemas.user_schema import UserSimpleInfo
from app.dependencies.auth import get_current_user
from app.services.erd_sql_generator import generate_sql

router = APIRouter(prefix="/erds", tags=["ERD Export"])


@router.get("/{erd_id}/export-sql")
def export_sql(
    erd_id: int,
    dbms: Literal["postgres", "mysql", "oracle"] = Query(...),
    db: Session = Depends(get_db),
    current_user: UserSimpleInfo = Depends(get_current_user),
):
    # ERD 존재 여부 확인
    erd = db.query(Erds).filter_by(erd_id=erd_id).first()
    if not erd:
        raise HTTPException(status_code=404, detail="ERD를 찾을 수 없습니다.")

    # 테이블, 컬럼, 관계 조회
    tables = db.query(ErdTables).filter_by(erd_id=erd_id).all()

    # 컬럼은 테이블 조인을 통해 erd_id 기준으로 필터링
    columns = (
        db.query(ErdColumns)
        .join(ErdTables, ErdColumns.table_id == ErdTables.table_id)
        .filter(ErdTables.erd_id == erd_id)
        .all()
    )

    relations = db.query(ErdRelations).filter_by(erd_id=erd_id).all()

    # SQL 생성
    sql = generate_sql(tables, columns, relations, dbms)

    return {"sql": sql}
