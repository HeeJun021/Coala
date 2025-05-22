from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.erd import Erds, ErdTables
from app.models.user import User
from app.schemas.erd import ErdCreate, ErdResponse
from app.dependencies.auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/projects", tags=["ERD"])

# ✅ 날짜 포맷 함수
def format_dt(dt: datetime):
    return dt.strftime("%Y-%m-%d %H:%M") if dt else None

# ✅ ERD 목록 조회
@router.get("/{project_id}/erds", response_model=list[ErdResponse])
def get_erd_list(project_id: int, db: Session = Depends(get_db)):
    results = (
        db.query(
            Erds,
            func.count(ErdTables.table_id).label("table_count"),
            User.nickname.label("last_editor_name"),
        )
        .outerjoin(ErdTables, Erds.erd_id == ErdTables.erd_id)
        .outerjoin(User, Erds.last_editor_id == User.user_id)
        .filter(Erds.project_id == project_id)
        .group_by(Erds.erd_id, User.nickname)
        .order_by(Erds.created_at.desc())
        .all()
    )

    return [
        ErdResponse(
            erd_id=row.Erds.erd_id,
            project_id=row.Erds.project_id,
            name=row.Erds.name,
            description=row.Erds.description,
            created_at=format_dt(row.Erds.created_at),  # ✅ 포맷 적용
            updated_at=format_dt(row.Erds.updated_at),
            last_editor_name=row.last_editor_name,
            table_count=row.table_count,
        )
        for row in results
    ]

# ✅ ERD 생성
@router.post("/{project_id}/erds", response_model=ErdResponse)
def create_erd(
    project_id: int,
    erd: ErdCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_erd = Erds(
        project_id=project_id,
        name=erd.name,
        description=erd.description,
        last_editor_id=current_user.user_id,
    )
    db.add(new_erd)
    db.commit()
    db.refresh(new_erd)

    return ErdResponse(
        erd_id=new_erd.erd_id,
        project_id=new_erd.project_id,
        name=new_erd.name,
        description=new_erd.description,
        created_at=format_dt(new_erd.created_at),  # ✅ 포맷 적용
        updated_at=format_dt(new_erd.updated_at),
        last_editor_name=current_user.nickname,
        table_count=0,
    )

# ✅ ERD 삭제
@router.delete("/{project_id}/erds/{erd_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_erd(
    project_id: int,
    erd_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    erd = db.query(Erds).filter(Erds.project_id == project_id, Erds.erd_id == erd_id).first()
    if not erd:
        raise HTTPException(status_code=404, detail="ERD not found")
    db.delete(erd)
    db.commit()
