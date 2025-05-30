from sqlalchemy.orm import Session
from app.models.erd import ErdTables, ErdColumns, ErdRelations

def export_erd_state_to_json(erd_id: int, db: Session) -> dict:
    # ✅ 1. 테이블 조회
    tables = db.query(ErdTables).filter_by(erd_id=erd_id).all()
    result_tables = []
    table_id_list = []

    for t in tables:
        table_id_list.append(t.table_id)
        result_tables.append({
            "table_id": t.table_id,
            "name": t.name,
            "description": t.description,
            "pos_x": t.pos_x,
            "pos_y": t.pos_y
        })

    # ✅ 2. 컬럼 조회
    columns = db.query(ErdColumns).filter(ErdColumns.table_id.in_(table_id_list)).all()
    result_columns = []
    for c in columns:
        result_columns.append({
            "column_id": c.column_id,
            "table_id": c.table_id,
            "name": c.name,
            "data_type": c.data_type,
            "is_primary": c.is_primary,
            "is_foreign": c.is_foreign,
            "is_not_null": c.is_not_null,
            "default_value": c.default_value,
            "column_order": c.column_order,
            "description": c.description
        })

    # ✅ 3. 관계 조회
    relations = db.query(ErdRelations).filter_by(erd_id=erd_id).all()
    result_relations = []
    for r in relations:
        result_relations.append({
            "relation_id": r.relation_id,
            "source_table_id": r.source_table_id,
            "source_column_id": r.source_column_id,
            "target_table_id": r.target_table_id,
            "target_column_id": r.target_column_id,
            "participation_left": r.participation_left,
            "participation_right": r.participation_right,
            "relation_left": r.relation_left,
            "relation_right": r.relation_right
        })

    return {
        "tables": result_tables,
        "columns": result_columns,
        "relations": result_relations
    }
