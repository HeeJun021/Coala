from pydantic import BaseModel
from typing import List, Optional, Literal, Any


class ErdCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ErdResponse(BaseModel):
    erd_id: int
    project_id: int
    name: str
    description: Optional[str] = None  # ✅ 이게 지금 누락되어 있었음!
    created_at: str  # ✅ datetime → str로 포맷된 형태 받음
    updated_at: Optional[str]
    last_editor_name: Optional[str]
    table_count: int

    class Config:
        from_attributes = True


# erd details
class ErdColumnOut(BaseModel):
    column_id: int
    name: str
    data_type: str
    is_primary: bool
    is_foreign: bool
    is_not_null: bool
    default_value: Optional[str]
    column_order: int
    description: Optional[str] = None  # ✅ 추가 필드!

    model_config = {"from_attributes": True}


class ErdTableOut(BaseModel):
    table_id: int
    name: str
    pos_x: int
    pos_y: int
    description: Optional[str] = None
    columns: List[ErdColumnOut]

    model_config = {"from_attributes": True}


class ErdRelationOut(BaseModel):
    relation_id: int
    source_table_id: int
    source_column_id: int
    target_table_id: int
    target_column_id: int
    relation_type: str


class ErdDetailOut(BaseModel):
    erd_id: int
    name: str
    description: Optional[str]
    project_id: int
    tables: List[ErdTableOut]
    relations: List[ErdRelationOut]


# 테이블 생성
class ErdTableCreate(BaseModel):
    name: Optional[str] = ""  # 기본값 ""로 설정
    pos_x: int
    pos_y: int
    description: Optional[str] = ""


# 개별 수정용 (name, description, 위치 등)
class ErdTablePartialUpdate(BaseModel):
    name: Optional[str] = None
    pos_x: Optional[int] = None
    pos_y: Optional[int] = None
    description: Optional[str] = None


class ErdTableOut(BaseModel):
    table_id: int
    name: str
    pos_x: int
    pos_y: int
    description: Optional[str]
    columns: List[ErdColumnOut] = []


# 속성 추가
class ErdColumnCreate(BaseModel):
    name: Optional[str] = ""  # ✅ 기본값 빈 문자열
    data_type: Optional[str] = ""
    is_primary: bool = False
    is_foreign: bool = False
    is_not_null: bool = False
    default_value: Optional[str] = None
    column_order: int = 0


# 속성 변경
class ErdColumnPartialUpdate(BaseModel):
    name: Optional[str] = None
    data_type: Optional[str] = None
    is_primary: Optional[bool] = None
    is_foreign: Optional[bool] = None
    is_not_null: Optional[bool] = None
    default_value: Optional[str] = None
    column_order: Optional[int] = None
    description: Optional[str]  # ✅ 이 줄 추가!


# 테이블 간 관계
class ErdRelationCreate(BaseModel):
    source_table_id: int
    source_column_id: int
    target_table_id: int
    target_column_id: int
    relation_type: Literal[
        "1..1",
        "1..0..1",
        "1..1..*",
        "1..0..*",
        "0..1..1",
        "0..1..1..*",
        "0..1..0..*",
        "1..*..1..*",
        "1..*..0..*",
        "0..*..1..*",
    ]


class ErdRelationOut(BaseModel):
    relation_id: int
    source_table_id: int
    source_column_id: int
    target_table_id: int
    target_column_id: int
    relation_type: str


# 다중 삭제
class ErdBulkDeleteRequest(BaseModel):
    table_ids: list[int] = []
    column_ids: list[int] = []
    relation_ids: list[int] = []


# 🔧 변경용 테이블/컬럼/관계
class ErdTableUpdate(BaseModel):
    table_id: int
    name: Optional[str] = None
    pos_x: Optional[int] = None
    pos_y: Optional[int] = None
    description: Optional[str] = None


class ErdColumnUpdate(BaseModel):
    column_id: int
    name: Optional[str] = None
    data_type: Optional[str] = None
    is_primary: Optional[bool] = None
    is_foreign: Optional[bool] = None
    is_not_null: Optional[bool] = None
    default_value: Optional[str] = None
    column_order: Optional[int] = None


class ErdRelationUpdate(BaseModel):
    relation_id: int
    relation_type: Optional[str] = None
    auto_create_fk: Optional[bool] = None
    cascade_delete: Optional[bool] = None


# 🧩 전체 요청 바디
class ErdSyncRequest(BaseModel):
    updated_tables: List[ErdTableUpdate] = []
    updated_columns: List[ErdColumnUpdate] = []
    updated_relations: List[ErdRelationUpdate] = []


# 스냅샷
class ErdSnapshotCreate(BaseModel):
    state_json: Any  # 전체 ERD 구조를 JSON 형태로 받음


# pk 설정
class SetPrimaryKeyRequest(BaseModel):
    is_primary: bool
