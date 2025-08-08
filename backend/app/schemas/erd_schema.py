from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime


class ErdCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ErdResponse(BaseModel):
    erd_id: int
    project_id: int
    name: str
    description: Optional[str] = None  
    created_at: str  
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
    description: Optional[str] = None  

    model_config = {"from_attributes": True}


class ErdTableOut(BaseModel):
    table_id: int
    name: str
    pos_x: int
    pos_y: int
    description: Optional[str] = None
    columns: List[ErdColumnOut]

    model_config = {"from_attributes": True}
    
class ErdForeignKeyColumnOut(BaseModel):
    column_id: int
    name: str
    table_id: int
    is_foreign: bool = True

 
class ErdRelationOut(BaseModel):
    relation_id: int
    source_table_id: int
    source_column_id: int
    target_table_id: int
    target_column_id: Optional[int]

    participation_source: Literal["required", "optional"]
    relation_type: Literal["1:1", "1:N"]  
    participation_target: Literal["required", "optional"]

    auto_create_fk: bool
    cascade_delete: bool

    fk_column: Optional[ErdForeignKeyColumnOut] = None

    model_config = {"from_attributes": True}



class ErdDetailOut(BaseModel):
    erd_id: int
    name: str
    description: Optional[str]
    project_id: int
    view_x: int
    view_y: int
    tables: List[ErdTableOut]
    relations: List[ErdRelationOut]
    
class ErdViewPositionUpdate(BaseModel):
    view_x: int
    view_y: int


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
    name: Optional[str] = ""   
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
    description: Optional[str]  = None
    
# 속성 순서 변경
class ColumnReorderRequest(BaseModel):
    table_id: int
    ordered_column_ids: List[int]


# 테이블 간 관계
class ErdRelationCreate(BaseModel):
    source_table_id: int
    source_column_id: int
    target_table_id: int
    target_column_id: Optional[int] = None

    participation_source: Literal["required", "optional"]
    relation_type: Literal["1:1", "1:N"]
    participation_target: Literal["required", "optional"]

    auto_create_fk: Optional[bool] = True
    cascade_delete: Optional[bool] = False



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


#   관계 수정용
class ErdRelationUpdate(BaseModel):
    relation_id: int
    participation_source: Optional[Literal["required", "optional"]] = None
    relation_type: Optional[Literal["1:1", "1:N"]] = None  #   논리적 관계 타입
    participation_target: Optional[Literal["required", "optional"]] = None
    auto_create_fk: Optional[bool] = None
    cascade_delete: Optional[bool] = None





# 🧩 전체 요청 바디
class ErdSyncRequest(BaseModel):
    updated_tables: List[ErdTableUpdate] = []
    updated_columns: List[ErdColumnUpdate] = []
    updated_relations: List[ErdRelationUpdate] = []

# PK 설정
class SetPrimaryKeyRequest(BaseModel):
    is_primary: bool


# ERD 이름 수정
class ErdNameUpdate(BaseModel):
    name: str
    
class SnapshotResponse(BaseModel):
    snapshot_id: int
    created_at: datetime
    log_id: int
    is_active: bool
    user_name: str