from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..models.memo_models import Memo
from ..schemas.memo_schemas import MemoResponse, MemoCreate, MemoUpdate
from ..database import get_db
from ..dependencies.auth import get_current_user
from ..models.user import User

router = APIRouter(prefix="/memos", tags=["Memos"])

@router.get("/my", response_model=List[MemoResponse])
async def get_my_memos(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    memos = db.query(Memo).filter(Memo.user_id == current_user.user_id).all()
    return memos

@router.get("/{memo_id}", response_model=MemoResponse)
async def get_memo_by_id(memo_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    memo = db.query(Memo).filter(Memo.memo_id == memo_id).first()
    if not memo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memo not found")
    if memo.user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this memo")
    return memo

@router.post("", response_model=MemoResponse)
async def create_memo(
    memo_data: MemoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_memo = Memo(
        user_id=current_user.user_id,
        blocks=[block.dict() for block in memo_data.blocks] if memo_data.blocks else []
    )
    db.add(new_memo)
    db.commit()
    db.refresh(new_memo)
    return new_memo

@router.patch("/{memo_id}", response_model=MemoResponse)
async def update_memo(
    memo_id: int,
    memo_data: MemoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    memo = db.query(Memo).filter(Memo.memo_id == memo_id).first()
    if not memo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memo not found")
    if memo.user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this memo")
    update_data = memo_data.dict(exclude_unset=True)
    if 'blocks' in update_data:
        update_data['blocks'] = update_data['blocks'] if update_data['blocks'] else []
    for key, value in update_data.items():
        setattr(memo, key, value)
    db.commit()
    db.refresh(memo)
    return memo

@router.delete("/{memo_id}", response_model=dict)
async def delete_memo(
    memo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    memo = db.query(Memo).filter(Memo.memo_id == memo_id).first()
    if not memo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memo not found")
    if memo.user_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this memo")
    db.delete(memo)
    db.commit()
    return {"detail": "Memo deleted"}