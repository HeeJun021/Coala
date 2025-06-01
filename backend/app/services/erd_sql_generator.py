import re

def generate_sql(tables, columns, relations, dbms):
    sql_statements = []

    # 1. 컬럼 정리: 테이블 ID → 컬럼 리스트
    columns_by_table = {}
    for col in columns:
        columns_by_table.setdefault(col.table_id, []).append(col)

    # 2. 관계 정리: ✅ FK는 target 테이블에 생긴다고 가정
    fk_by_table = {}
    for rel in relations:
        if not rel.auto_create_fk:
            continue
        fk_by_table.setdefault(rel.target_table_id, []).append(rel)  # ✅ target이 FK 갖는 쪽

    # 3. 테이블 ID → 테이블 객체
    table_lookup = {table.table_id: table for table in tables}

    # 4. 테이블 정렬: source(PK 대상)로 참조당하는 횟수 기준
    def table_order_key(t):
        return -sum(1 for rel in relations if rel.source_table_id == t.table_id)
    tables_sorted = sorted(tables, key=table_order_key)

    # 5. 테이블별 CREATE TABLE 생성
    for table in tables_sorted:
        table_columns = columns_by_table.get(table.table_id, [])
        table_relations = fk_by_table.get(table.table_id, [])
        lines = []

        # 컬럼 정의
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

        # PK 정의
        pk_cols = [col.name for col in table_columns if col.is_primary]
        if pk_cols:
            lines.append(f"  PRIMARY KEY ({', '.join(f'`{pk}`' for pk in pk_cols)})")

        # FK 정의 (✅ target이 FK 가진 쪽임)
        for rel in table_relations:
            if not rel.target_column or not rel.source_column:
                continue  # 필수 정보 빠졌으면 건너뜀

            fk_column_name = rel.target_column.name
            fk_table_name = table.name
            ref_table_name = rel.source_table.name
            ref_column_name = rel.source_column.name

            fk_line = (
                f"  CONSTRAINT `fk_{rel.relation_id}` FOREIGN KEY (`{fk_column_name}`) "
                f"REFERENCES `{ref_table_name}`(`{ref_column_name}`)"
            )
            if rel.cascade_delete:
                fk_line += " ON DELETE CASCADE"

            lines.append(fk_line)

        # CREATE TABLE 조립
        table_sql = f"CREATE TABLE `{table.name}` (\n" + ",\n".join(lines) + "\n);"
        sql_statements.append(table_sql)

    return "\n\n".join(sql_statements)

# ✅ DBMS별 데이터 타입 매핑 함수는 그대로 사용
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
