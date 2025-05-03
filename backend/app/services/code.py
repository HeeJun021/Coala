# app/services/code.py
from sqlalchemy.orm import Session
from app.models.code import CodeFolder, Code, CodeFolderMapping
from datetime import datetime
from collections import defaultdict

def get_or_create_root_folder(db: Session, user_id: int):
    root = (
        db.query(CodeFolder)
        .filter(CodeFolder.user_id == user_id, CodeFolder.parent_folder_id == None)
        .first()
    )
    if root:
        return root

    new_root = CodeFolder(
        user_id=user_id,
        user_folder_index=0,
        folder_name="내 파일",
        parent_folder_id=None
    )
    db.add(new_root)
    db.commit()
    db.refresh(new_root)
    return new_root


def create_code_template_structure(db: Session, user_id: int, template_name: str, files: list, parent_folder_id: int):
    # user_folder_index는 현재 사용자 최대 index + 1
    max_index = db.query(CodeFolder.user_folder_index)\
                  .filter(CodeFolder.user_id == user_id)\
                  .order_by(CodeFolder.user_folder_index.desc())\
                  .first()
    next_index = (max_index[0] + 1) if max_index else 1

    folder = CodeFolder(
        user_id=user_id,
        user_folder_index=next_index,
        folder_name=template_name,
        parent_folder_id=parent_folder_id,
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)

    # 파일들 저장
    for file in files:
        code = Code(
            user_id=user_id,
            title=file.filename,
            content=file.content,
            language_id=file.language_id,
        )
        db.add(code)
        db.commit()
        db.refresh(code)

        mapping = CodeFolderMapping(
            folder_id=folder.folder_id,
            code_id=code.code_id
        )
        db.add(mapping)

    db.commit()
    return folder

def build_folder_tree(db: Session, user_id: int):
    folders = db.query(CodeFolder).filter(CodeFolder.user_id == user_id).all()
    codes = db.query(Code).filter(Code.user_id == user_id).all()
    mappings = db.query(CodeFolderMapping).join(Code).filter(Code.user_id == user_id).all()

    folder_dict = {f.folder_id: {"name": f.folder_name, "children": {}, "type": "folder"} for f in folders}
    code_dict = defaultdict(list)

    for mapping in mappings:
        code = next((c for c in codes if c.code_id == mapping.code_id), None)
        if code:
            code_dict[mapping.folder_id].append({
                "name": code.title,
                "content": code.content,
                "language_id": code.language_id,
                "type": "file"
            })

    for folder in folders:
        fid = folder.folder_id
        if folder.parent_folder_id:
            folder_dict[folder.parent_folder_id]["children"][fid] = folder_dict[fid]

        for file in code_dict.get(fid, []):
            folder_dict[fid]["children"][file["name"]] = file

    # 루트 폴더만 추출
    root_folders = [v for f in folders if not f.parent_folder_id for v in [folder_dict[f.folder_id]]]
    return {str(i): folder for i, folder in enumerate(root_folders)}
