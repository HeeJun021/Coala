from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP, func, Boolean, JSON, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Erds(Base):
    __tablename__ = "erds"

    erd_id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    last_editor_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"))

    project = relationship("Project", back_populates="erds")
    last_editor = relationship("User")
    tables = relationship("ErdTables", back_populates="erd", cascade="all, delete-orphan")
    relations = relationship("ErdRelations", back_populates="erd", cascade="all, delete-orphan")
    activity_logs = relationship("ErdActivityLogs", back_populates="erd", cascade="all, delete-orphan")
    snapshots = relationship("ErdSnapshot", back_populates="erd", cascade="all, delete-orphan")


class ErdTables(Base):
    __tablename__ = "erdtables"

    table_id = Column(Integer, primary_key=True, index=True)
    erd_id = Column(Integer, ForeignKey("erds.erd_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=True)
    description = Column(Text)
    pos_x = Column(Integer, default=0)
    pos_y = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    erd = relationship("Erds", back_populates="tables")
    columns = relationship("ErdColumns", back_populates="table", cascade="all, delete-orphan")
    source_relations = relationship("ErdRelations", foreign_keys="[ErdRelations.source_table_id]", back_populates="source_table")
    target_relations = relationship("ErdRelations", foreign_keys="[ErdRelations.target_table_id]", back_populates="target_table")


class ErdColumns(Base):
    __tablename__ = "erdcolumns"

    column_id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("erdtables.table_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=True)
    data_type = Column(String(50), nullable=True)
    is_primary = Column(Boolean, default=False)
    is_foreign = Column(Boolean, default=False)
    is_not_null = Column(Boolean, default=False)
    default_value = Column(String(100), nullable=True)
    column_order = Column(Integer, default=0)
    description = Column(Text, nullable=True)

    table = relationship("ErdTables", back_populates="columns")
    source_relations = relationship("ErdRelations", foreign_keys="[ErdRelations.source_column_id]", back_populates="source_column")
    target_relations = relationship("ErdRelations", foreign_keys="[ErdRelations.target_column_id]", back_populates="target_column")


class ErdRelations(Base):
    __tablename__ = "erdrelations"

    relation_id = Column(Integer, primary_key=True, index=True)
    erd_id = Column(Integer, ForeignKey("erds.erd_id", ondelete="CASCADE"), nullable=False)
    source_table_id = Column(Integer, ForeignKey("erdtables.table_id", ondelete="CASCADE"), nullable=False)
    source_column_id = Column(Integer, ForeignKey("erdcolumns.column_id", ondelete="CASCADE"), nullable=False)
    target_table_id = Column(Integer, ForeignKey("erdtables.table_id", ondelete="CASCADE"), nullable=False)
    target_column_id = Column(Integer, ForeignKey("erdcolumns.column_id", ondelete="CASCADE"), nullable=True)
    relation_type = Column(String(20), nullable=False)
    auto_create_fk = Column(Boolean, default=True)
    cascade_delete = Column(Boolean, default=False)

    erd = relationship("Erds", back_populates="relations")
    source_table = relationship("ErdTables", foreign_keys=[source_table_id], back_populates="source_relations")
    target_table = relationship("ErdTables", foreign_keys=[target_table_id], back_populates="target_relations")
    source_column = relationship("ErdColumns", foreign_keys=[source_column_id], back_populates="source_relations")
    target_column = relationship("ErdColumns", foreign_keys=[target_column_id], back_populates="target_relations")

class ErdSnapshot(Base):
    __tablename__ = "erdsnapshots"  # PascalCase로 테이블 이름 유지

    snapshot_id = Column(Integer, primary_key=True, autoincrement=True)  # PostgreSQL IDENTITY 호환
    erd_id = Column(Integer, ForeignKey("erds.erd_id", ondelete="CASCADE"), nullable=False)
    state_json = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    # 관계 설정 (역참조: 필요 시 사용 가능)
    erd = relationship("Erds", back_populates="snapshots", lazy="joined")

class ErdActivityLogs(Base):
    __tablename__ = "erdactivitylogs"

    log_id = Column(Integer, primary_key=True, index=True)
    erd_id = Column(Integer, ForeignKey("erds.erd_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    action_type = Column(String(50), nullable=False)
    target_name = Column(String(100))
    message = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # ✅ Undo/Redo 상태 관리용 필드
    undone = Column(Boolean, default=False)

    erd = relationship("Erds", back_populates="activity_logs")
    user = relationship("User")
    details = relationship("ErdActivityLogDetails", back_populates="log", cascade="all, delete-orphan")


class ErdActivityLogDetails(Base):
    __tablename__ = "erdactivitylogdetails"

    detail_id = Column(Integer, primary_key=True, index=True)
    log_id = Column(Integer, ForeignKey("erdactivitylogs.log_id", ondelete="CASCADE"), nullable=False)
    change_type = Column(String(20), nullable=False)
    target_type = Column(String(20), nullable=False)
    target_name = Column(String(100))
    target_field = Column(String(50)) # ✅ 변경된 속성명 (예: name, data_type)
    before_value = Column(Text)
    after_value = Column(Text)

    log = relationship("ErdActivityLogs", back_populates="details")
