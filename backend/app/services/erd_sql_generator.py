import re

# ✅ generate_sql 함수 (ERD 테이블 생성 시 FK 포함)
def generate_sql(tables, columns, relations, dbms):
    sql_statements = []

    # 테이블별 컬럼 정리
    columns_by_table = {}
    for col in columns:
        columns_by_table.setdefault(col.table_id, []).append(col)

    # 테이블별 관계 정리 (source_table_id 기준으로 묶기)
    fk_by_table = {}
    for rel in relations:
        if not rel.auto_create_fk:
            continue
        fk_by_table.setdefault(rel.source_table_id, []).append(rel)

    # 테이블 ID → 테이블 객체 빠르게 찾기용
    table_lookup = {table.table_id: table for table in tables}

    # 테이블을 참조 순서대로 정렬 (참조되는 테이블 먼저)
    def table_order_key(t):
        return sum(1 for rel in relations if rel.source_table_id == t.table_id)
    tables_sorted = sorted(tables, key=table_order_key)

    # 🔁 테이블 생성문
    for table in tables_sorted:
        table_columns = columns_by_table.get(table.table_id, [])
        table_relations = fk_by_table.get(table.table_id, [])
        lines = []

        for col in sorted(table_columns, key=lambda x: x.column_order):
            data_type = map_data_type(col.data_type, dbms)
            line = f"  `{col.name}` {data_type}"

            if col.is_not_null:
                line += " NOT NULL"
            else:
                line += " NULL"

            if col.default_value:
                default = col.default_value
                if re.match(r"(?i)char|text|varchar", data_type):
                    default = f"'{default}'"
                line += f" DEFAULT {default}"

            lines.append(line)

        # PK 설정
        pk_cols = [col.name for col in table_columns if col.is_primary]
        if pk_cols:
            lines.append(f"  PRIMARY KEY ({', '.join(f'`{pk}`' for pk in pk_cols)})")

        # FK 제약조건 추가
        for rel in table_relations:
            if not rel.source_column or not rel.target_column:
                continue
            fk_line = (
                f"  CONSTRAINT `fk_{rel.relation_id}` FOREIGN KEY (`{rel.source_column.name}`) "
                f"REFERENCES `{rel.target_table.name}`(`{rel.target_column.name}`)"
            )
            if rel.cascade_delete:
                fk_line += " ON DELETE CASCADE"
            lines.append(fk_line)

        table_sql = f"CREATE TABLE `{table.name}` (\n" + ",\n".join(lines) + "\n);"
        sql_statements.append(table_sql)

    return "\n\n".join(sql_statements)


# ✅ 데이터 타입 매핑 함수
def map_data_type(data_type: str, dbms: str) -> str:
    type_map = {
        "postgres": {
            "INT": "INTEGER",
            "BIGINT": "BIGINT",
            "VARCHAR": "VARCHAR(255)",
            "TEXT": "TEXT",
            "BOOLEAN": "BOOLEAN",
            "DATE": "DATE",
            "TIMESTAMP": "TIMESTAMP",
            "DECIMAL": "DECIMAL(10,2)",
            "FLOAT": "REAL",
            "CHAR": "CHAR(1)",
        },
        "mysql": {
            "INT": "INT",
            "BIGINT": "BIGINT",
            "VARCHAR": "VARCHAR(255)",
            "TEXT": "TEXT",
            "BOOLEAN": "TINYINT(1)",
            "DATE": "DATE",
            "TIMESTAMP": "DATETIME",
            "DECIMAL": "DECIMAL(10,2)",
            "FLOAT": "FLOAT",
            "CHAR": "CHAR(1)",
        },
        "oracle": {
            "INT": "NUMBER",
            "BIGINT": "NUMBER(19)",
            "VARCHAR": "VARCHAR2(255)",
            "TEXT": "CLOB",
            "BOOLEAN": "NUMBER(1)",
            "DATE": "DATE",
            "TIMESTAMP": "TIMESTAMP",
            "DECIMAL": "NUMBER(10,2)",
            "FLOAT": "FLOAT",
            "CHAR": "CHAR(1)",
        },
    }
    return type_map[dbms].get(data_type.upper(), data_type)
