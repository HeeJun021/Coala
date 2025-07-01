# 경로: app/services/code_folder_service.py

from sqlalchemy.orm import Session
from typing import List
from app.models.code_models import CodeFolder, Code, CodeFolderMapping
from app.models.user import User
from app.schemas.code_schema import CodeCreate, CodeResponse, CodeUpdate
from datetime import datetime
from fastapi import HTTPException

# 언어별 확장자 매핑
EXTENSIONS = {
    1: ".html",
    2: ".css",
    3: ".js",
    4: ".py"
}

def append_extension(title: str, language_id: int) -> str:
    ext = EXTENSIONS.get(language_id, "")
    if not title.endswith(ext):
        return title + ext
    return title

def get_or_create_root_folder(db: Session, user: dict) -> CodeFolder:
    """
    사용자의 최상위(루트) 폴더가 없으면 생성하고 반환합니다.
    """
    user_id = user["user_id"]

    folder = (
        db.query(CodeFolder)
        .filter(CodeFolder.user_id == user_id)
        .filter(CodeFolder.parent_folder_id.is_(None))
        .first()
    )

    if folder:
        return folder

    # user_folder_index = 1부터 시작
    next_index = (
        db.query(CodeFolder)
        .filter(CodeFolder.user_id == user_id)
        .count() + 1
    )

    new_folder = CodeFolder(
        user_id=user_id,
        folder_name="내 코드",
        user_folder_index=next_index,
        parent_folder_id=None,
        created_at=datetime.utcnow(),
    )

    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)

    return new_folder

def create_child_folder(
    db: Session, user: dict, parent_folder_id: int | None, folder_name: str
) -> CodeFolder:
    """
    하위 폴더 생성 (parent_folder_id가 None이면 최상위 폴더)
    """
    user_id = user["user_id"]

    #   parent_folder_id가 있을 경우, 해당 폴더가 사용자 소유인지 확인
    if parent_folder_id is not None:
        parent = db.query(CodeFolder).filter(
            CodeFolder.folder_id == parent_folder_id,
            CodeFolder.user_id == user_id
        ).first()
        if not parent:
            raise ValueError("해당 폴더에 대한 권한이 없습니다.")

    # 다음 user_folder_index 계산
    max_index = (
        db.query(CodeFolder.user_folder_index)
        .filter(CodeFolder.user_id == user_id)
        .order_by(CodeFolder.user_folder_index.desc())
        .first()
    )
    next_index = (max_index[0] + 1) if max_index else 0

    # 폴더 생성
    new_folder = CodeFolder(
        user_id=user_id,
        user_folder_index=next_index,
        folder_name=folder_name,
        parent_folder_id=parent_folder_id,
        created_at=datetime.utcnow()
    )
    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)
    return new_folder

def create_code_with_mapping(db: Session, user: dict, code_data: CodeCreate) -> CodeResponse:
    from os.path import splitext

    user_id = user["user_id"]

    # 1. 폴더 존재 및 권한 확인
    folder = db.query(CodeFolder).filter(
        CodeFolder.folder_id == code_data.folder_id,
        CodeFolder.user_id == user_id
    ).first()
    if not folder:
        raise HTTPException(status_code=403, detail="해당 폴더에 대한 권한이 없습니다.")

    # 2. 확장자로 언어 판별
    EXTENSION_TO_LANGUAGE_ID = {
        ".html": 1,
        ".css": 2,
        ".js": 3,
        ".py": 4,
        ".jsx": 3,  # JavaScript와 동일
        ".vue": 3,  # JavaScript와 동일
        ".json": 5,  # 기타
        ".config.js": 5,  # 기타
        ".txt": 5,  # 기타
    }
    ext = splitext(code_data.title)[1] or code_data.title  # 복합 확장자 처리
    language_id = EXTENSION_TO_LANGUAGE_ID.get(ext, 5)  # 기본값: 5 (기타)

    # 3. 코드 저장
    new_code = Code(
        user_id=user_id,
        title=code_data.title,
        content=code_data.content,
        language_id=language_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(new_code)
    db.commit()
    db.refresh(new_code)

    # 4. 매핑 저장
    mapping = CodeFolderMapping(
        folder_id=code_data.folder_id,
        code_id=new_code.code_id,
        updated_at=datetime.utcnow()
    )
    db.add(mapping)
    db.commit()

    return CodeResponse(
        code_id=new_code.code_id,
        title=new_code.title,
        content=new_code.content,
        language_id=new_code.language_id,
        created_at=new_code.created_at,
        updated_at=new_code.updated_at
    )

def get_root_folder(db: Session, user: dict) -> CodeFolder:
    """
    사용자 루트 폴더 반환
    """
    return db.query(CodeFolder).filter(
        CodeFolder.user_id == user["user_id"],
        CodeFolder.parent_folder_id.is_(None)
    ).first()

def get_child_folders(db: Session, user: dict, parent_folder_id: int) -> list[CodeFolder]:
    """
    특정 폴더의 하위 폴더 반환
    """
    return db.query(CodeFolder).filter(
        CodeFolder.user_id == user["user_id"],
        CodeFolder.parent_folder_id == parent_folder_id
    ).all()

def get_codes_in_folder(db: Session, user: dict, folder_id: int) -> List[CodeResponse]:
    """
    특정 폴더 안의 코드 목록 반환
    """
    codes = (
        db.query(Code)
        .join(CodeFolderMapping, Code.code_id == CodeFolderMapping.code_id)
        .join(CodeFolder, CodeFolder.folder_id == CodeFolderMapping.folder_id)
        .filter(CodeFolder.folder_id == folder_id, CodeFolder.user_id == user["user_id"])
        .all()
    )
    return [CodeResponse.model_validate(code) for code in codes]

def get_code_by_id(db: Session, user: dict, code_id: int) -> CodeResponse:
    """
    코드 파일 단건 조회
    """
    code = db.query(Code).filter(Code.code_id == code_id, Code.user_id == user["user_id"]).first()
    if not code:
        raise HTTPException(status_code=404, detail="코드를 찾을 수 없습니다.")
    return CodeResponse.model_validate(code)

def update_code_content(
    db: Session, user: dict, code_id: int, update_data: CodeUpdate
) -> CodeResponse:
    """
    코드 파일 내용 및 언어 수정
    """
    code = db.query(Code).filter(Code.code_id == code_id, Code.user_id == user["user_id"]).first()
    if not code:
        raise HTTPException(status_code=404, detail="해당 코드를 찾을 수 없습니다.")

    # 언어 ID 유효성 체크
    if update_data.language_id not in [1, 2, 3, 4]:
        raise HTTPException(status_code=400, detail="지원하지 않는 언어입니다.")

    code.content = update_data.content
    code.language_id = update_data.language_id
    code.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(code)
    return CodeResponse.model_validate(code)

def update_code_title(db: Session, user: dict, code_id: int, new_title: str) -> CodeResponse:
    code = db.query(Code).filter(Code.code_id == code_id, Code.user_id == user["user_id"]).first()
    if not code:
        raise HTTPException(status_code=404, detail="코드를 찾을 수 없습니다.")

    title_with_ext = append_extension(new_title, code.language_id)
    code.title = title_with_ext
    code.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(code)
    return CodeResponse.model_validate(code)

def update_folder_name(db: Session, user: dict, folder_id: int, new_name: str) -> CodeFolder:
    folder = db.query(CodeFolder).filter(
        CodeFolder.folder_id == folder_id,
        CodeFolder.user_id == user["user_id"]
    ).first()

    if not folder:
        raise HTTPException(status_code=404, detail="폴더를 찾을 수 없습니다.")

    folder.folder_name = new_name
    db.commit()
    db.refresh(folder)
    return folder

def delete_code(db: Session, user: dict, code_id: int) -> None:
    code = db.query(Code).filter(Code.code_id == code_id, Code.user_id == user["user_id"]).first()
    if not code:
        raise HTTPException(status_code=404, detail="코드를 찾을 수 없습니다.")
    db.query(CodeFolderMapping).filter(CodeFolderMapping.code_id == code_id).delete()
    db.delete(code)
    db.commit()

def delete_folder_and_contents(db: Session, user: dict, folder_id: int) -> None:
    user_id = user["user_id"]

    # 먼저 삭제 대상 폴더 조회
    folder = db.query(CodeFolder).filter(
        CodeFolder.folder_id == folder_id,
        CodeFolder.user_id == user_id
    ).first()

    if not folder:
        raise HTTPException(status_code=404, detail="폴더를 찾을 수 없습니다.")

    # 하위 폴더들 재귀적으로 삭제
    child_folders = db.query(CodeFolder).filter(
        CodeFolder.parent_folder_id == folder_id,
        CodeFolder.user_id == user_id
    ).all()

    for child in child_folders:
        delete_folder_and_contents(db, user, child.folder_id)

    # 해당 폴더 안의 코드 조회 및 삭제
    mappings = db.query(CodeFolderMapping).filter(CodeFolderMapping.folder_id == folder_id).all()
    code_ids = [m.code_id for m in mappings]

    db.query(CodeFolderMapping).filter(CodeFolderMapping.folder_id == folder_id).delete()
    if code_ids:
        db.query(Code).filter(Code.code_id.in_(code_ids)).delete(synchronize_session=False)

    # 마지막으로 폴더 자체 삭제
    db.delete(folder)
    db.commit()
