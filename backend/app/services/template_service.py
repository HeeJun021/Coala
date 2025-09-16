# app/services/template_service.py

from __future__ import annotations
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime

from app.templates.catalog import TEMPLATE_CATALOG
from app.services.code import (
    get_or_create_root_folder,
    create_child_folder,
    create_code_with_mapping,
)
from app.schemas.code_schema import CodeCreate

def _folder_name_exists(db: Session, user: dict, parent_folder_id: int, folder_name: str) -> bool:
    from app.models.code_models import CodeFolder
    return db.query(CodeFolder).filter(
        CodeFolder.user_id == user["user_id"],
        CodeFolder.parent_folder_id == parent_folder_id,
        CodeFolder.folder_name == folder_name
    ).first() is not None

def _make_unique_folder_name(db: Session, user: dict, parent_folder_id: int, base_name: str) -> str:
    if not _folder_name_exists(db, user, parent_folder_id, base_name):
        return base_name
    i = 2
    while True:
        candidate = f"{base_name}-{i}"
        if not _folder_name_exists(db, user, parent_folder_id, candidate):
            return candidate
        i += 1

def _create_tree_recursive(
    db: Session,
    user: dict,
    parent_folder_id: int,
    tree: Dict[str, Any],
    parent_path: str,
    created_folders: List[Dict[str, Any]],
    created_files: List[Dict[str, Any]],
) -> None:
    """
    tree: { "file.ext": "content", "dir": { ... } }
    """
    for name, val in tree.items():
        is_dir = isinstance(val, dict)
        if is_dir:
            sub = create_child_folder(db, user, parent_folder_id, name)
            created_folders.append({
                "folder_id": sub.folder_id,
                "path": f"{parent_path}{name}/"
            })
            _create_tree_recursive(
                db=db,
                user=user,
                parent_folder_id=sub.folder_id,
                tree=val,
                parent_path=f"{parent_path}{name}/",
                created_folders=created_folders,
                created_files=created_files,
            )
        else:
            # 파일 생성 (언어 ID는 create_code_with_mapping 내부에서 확장자 기준으로 판별)
            code_resp = create_code_with_mapping(
                db, user,
                CodeCreate(
                    title=name,
                    content=val or "",
                    language_id=3,   # placeholder: 실제 언어는 내부에서 확장자로 판별
                    folder_id=parent_folder_id,
                )
            )
            created_files.append({
                "code_id": code_resp.code_id,
                "path": f"{parent_path}{name}",
                "language_id": code_resp.language_id
            })

def materialize_template(
    db: Session,
    *,
    user: dict,
    template_id: str,
    folder_name: Optional[str] = None,
    overwrite: bool = False,
):
    if template_id not in TEMPLATE_CATALOG:
        raise ValueError("Unknown template_id")

    spec = TEMPLATE_CATALOG[template_id]
    tree = spec["tree"]
    base_name = folder_name or spec.get("default_folder_name") or template_id

    # 1) 사용자 루트 폴더
    root = get_or_create_root_folder(db, user)

    # 2) 최상위 폴더명(중복 시 접미사)
    final_name = base_name if overwrite else _make_unique_folder_name(db, user, root.folder_id, base_name)

    created_folders: List[Dict[str, Any]] = []
    created_files: List[Dict[str, Any]] = []

    # 트랜잭션 블록 제거 (내부 함수가 commit 함)
    top = create_child_folder(db, user, root.folder_id, final_name)
    created_folders.append({"folder_id": top.folder_id, "path": f"{final_name}/"})

    _create_tree_recursive(
        db=db,
        user=user,
        parent_folder_id=top.folder_id,
        tree=tree,
        parent_path=f"{final_name}/",
        created_folders=created_folders,
        created_files=created_files,
    )

    return top.folder_id, created_folders, created_files