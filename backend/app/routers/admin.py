from app.services import question as question_service
from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import admin_service, board
from app.schemas.question_schema import QuestionCreate
from app.schemas.admin_user import UserDetailResponse, UserSummary
from app.schemas.board_schema import PostResponse, CommentResponse
from app.services.admin_service import get_user_detail_by_id, get_all_users_with_stats
from typing import List, Dict
from pydantic import BaseModel
from app.models.study_materials_models import StudyMaterials
from app.models.study_example_models import StudyExample
from app.models.language import Language
from pathlib import Path
import logging, json
from sqlalchemy.sql import text

router = APIRouter(prefix="/admin", tags=["Admin"])
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# ----------------------------
# 📌 Pydantic 모델 정의
# ----------------------------
class Section(BaseModel):
    type: str
    content: str | List[Dict] | Dict
    description: str | None = None
    style: str | None = None
    title: str | None = None
    problem_description: str | None = None

    model_config = {"from_attributes": True}


class StudyMaterialCreate(BaseModel):
    language_id: int
    title: str
    content: str
    sections: List[Section]
    is_example: bool = False
    order: int = 0


class MaterialOrderUpdate(BaseModel):
    materials: List[dict]


class LanguageCreate(BaseModel):
    language: str


# ----------------------------
# 📌 대시보드 / 신고 관련
# ----------------------------
@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    return admin_service.get_dashboard_summary(db)


@router.get("/reports/recent")
def get_recent_reports(db: Session = Depends(get_db)):
    return admin_service.get_recent_reports(db)


@router.get("/reports/weekly")
def get_weekly_report_trend(db: Session = Depends(get_db)):
    return admin_service.get_weekly_report_trend(db)


# ----------------------------
# 📌 문제 관리
# ----------------------------
@router.post("/questions/create", response_model=dict)
def create_question(payload: QuestionCreate, db: Session = Depends(get_db)):
    created_question = question_service.create_question(db, payload)
    return {"message": "문제가 성공적으로 생성되었습니다.", "question_id": created_question.question_id}


@router.delete("/questions/{question_id}", response_model=dict)
def delete_question(question_id: int, db: Session = Depends(get_db)):
    success = question_service.delete_question(db, question_id)
    if not success:
        raise HTTPException(status_code=404, detail="해당 문제를 찾을 수 없습니다.")
    return {"message": f"문제 {question_id}가 성공적으로 삭제되었습니다."}


# ----------------------------
# 📌 사용자 관리
# ----------------------------
@router.get("/users/{user_id}", response_model=UserDetailResponse)
def get_user_detail(user_id: int, db: Session = Depends(get_db)):
    data = get_user_detail_by_id(db, user_id)
    if not data:
        raise HTTPException(status_code=404, detail="해당 사용자를 찾을 수 없습니다.")
    user = data["user"]
    return {
        "user_id": user.user_id,
        "nickname": user.nickname,
        "email": user.email,
        "profile_image_url": user.profile_image_url,
        "created_at": user.created_at,
        "tier": user.tier,
        "report_count": data["report_count"],
        "posts": data["posts"],
        "comments": data["comments"],
    }


@router.get("/users", response_model=List[UserSummary])
def get_all_users(db: Session = Depends(get_db)):
    return get_all_users_with_stats(db)


# ----------------------------
# 📌 게시판 관리
# ----------------------------
@router.delete("/comments/{comment_id}", response_model=dict)
def admin_delete_comment(comment_id: int, db: Session = Depends(get_db)):
    admin_service.admin_delete_comment(comment_id, db)
    return {"message": "댓글이 삭제되었습니다."}


@router.get("/posts", response_model=List[PostResponse])
def get_all_posts(board_type: str = Query(...), db: Session = Depends(get_db)):
    return admin_service.get_all_posts_by_board(board_type, db)


# ✅ 게시글 단건 조회 (board 서비스 재활용)
@router.get("/posts/{post_id}", response_model=PostResponse)
def get_post_detail(post_id: int, db: Session = Depends(get_db)):
    post = board.get_post(post_id, db)   # 기존 회원 전용 함수 재사용
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    return post


# ✅ 게시글별 댓글 조회 (board 서비스 재활용)
@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
def get_post_comments(post_id: int, db: Session = Depends(get_db)):
    return board.get_comments(post_id, db)  # 기존 회원 전용 함수 재사용


@router.delete("/posts/{post_id}", response_model=dict)
def admin_delete_post(post_id: int, db: Session = Depends(get_db)):
    board.delete_post(post_id, db)
    return {"message": "게시글이 삭제되었습니다."}


# ----------------------------
# 📌 학습 자료 관리
# ----------------------------
@router.get("/study-materials/summary")
def get_study_material_summary(language: str, db: Session = Depends(get_db)):
    language_obj = db.query(Language).filter(Language.language == language).first()
    if not language_obj:
        raise HTTPException(status_code=404, detail="해당 언어를 찾을 수 없습니다.")

    materials = db.query(StudyMaterials).filter(
        StudyMaterials.language_id == language_obj.language_id
    ).order_by(StudyMaterials.order).all()

    examples = db.query(StudyExample).filter(
        StudyExample.language_id == language_obj.language_id
    ).order_by(StudyExample.order).all()

    result = [
        {
            "material_id": m.material_id,
            "title": m.title,
            "content": m.content,
            "language_id": m.language_id,
            "sections": m.sections,
            "read_count": 0,
            "is_example": False,
            "order": m.order,
        }
        for m in materials
    ] + [
        {
            "example_id": e.example_id,
            "title": e.title,
            "content": e.content,
            "language_id": e.language_id,
            "sections": e.sections,
            "read_count": 0,
            "is_example": True,
            "order": e.order,
        }
        for e in examples
    ]

    return result


@router.delete("/study-materials/{material_id}")
def delete_study_material(material_id: int, db: Session = Depends(get_db)):
    material = db.query(StudyMaterials).filter(StudyMaterials.material_id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="학습자료를 찾을 수 없습니다.")
    db.delete(material)
    db.commit()
    return {"message": "학습자료가 성공적으로 삭제되었습니다."}


@router.post("/upload/image", response_model=dict)
async def upload_image(file: UploadFile = File(...)):
    logging.info(f"이미지 업로드 요청: 파일명={file.filename}, 타입={file.content_type}")
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능")
    upload_dir = Path("uploads/images")
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / file.filename
    with file_path.open("wb") as buffer:
        buffer.write(await file.read())
    return {"image_path": f"/uploads/images/{file.filename}"}


@router.post("/study-materials/create", response_model=dict)
@router.post("/examples/create", response_model=dict)
def create_study_material_or_example(payload: StudyMaterialCreate, db: Session = Depends(get_db)):
    table_name = "study_example" if payload.is_example else "study_materials"
    sections_json = json.dumps([section.dict() for section in payload.sections])
    query = text(f"""
        INSERT INTO {table_name} (language_id, title, content, sections, "order")
        VALUES (:language_id, :title, :content, CAST(:sections AS JSONB),
        (SELECT COALESCE(MAX("order"), 0) + 1 FROM {table_name}))
        RETURNING {'example_id' if payload.is_example else 'material_id'}
    """)
    result = db.execute(query, {
        "language_id": payload.language_id,
        "title": payload.title,
        "content": payload.content,
        "sections": sections_json,
    })
    db.commit()
    id_value = result.fetchone()[0]
    return {"message": f"{'예제' if payload.is_example else '학습자료'}가 성공적으로 생성되었습니다.", "id": id_value}


@router.put("/study-materials/{material_id}", response_model=dict)
async def update_study_material(material_id: int, material_data: StudyMaterialCreate, db: Session = Depends(get_db)):
    material = db.query(StudyMaterials).filter(StudyMaterials.material_id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="학습자료를 찾을 수 없습니다.")
    material.title = material_data.title
    material.content = material_data.content
    material.language_id = material_data.language_id
    material.sections = [section.dict() for section in material_data.sections]
    material.order = material_data.order
    db.commit()
    db.refresh(material)
    return {"message": "학습자료가 성공적으로 수정되었습니다.", "material_id": material.material_id}


@router.put("/examples/{example_id}", response_model=dict)
async def update_study_example(example_id: int, example_data: StudyMaterialCreate, db: Session = Depends(get_db)):
    example = db.query(StudyExample).filter(StudyExample.example_id == example_id).first()
    if not example:
        raise HTTPException(status_code=404, detail="예제를 찾을 수 없습니다.")
    example.title = example_data.title
    example.content = example_data.content
    example.language_id = example_data.language_id
    example.sections = [section.dict() for section in example_data.sections]
    example.order = example_data.order
    db.commit()
    db.refresh(example)
    return {"message": "예제가 성공적으로 수정되었습니다.", "example_id": example.example_id}


@router.delete("/examples/{example_id}", response_model=dict)
async def delete_study_example(example_id: int, db: Session = Depends(get_db)):
    example = db.query(StudyExample).filter(StudyExample.example_id == example_id).first()
    if not example:
        raise HTTPException(status_code=404, detail="예제를 찾을 수 없습니다.")
    db.delete(example)
    db.commit()
    return {"message": "예제가 성공적으로 삭제되었습니다."}


@router.post("/study-materials/update-order", response_model=dict)
def update_material_order(order_data: MaterialOrderUpdate, db: Session = Depends(get_db)):
    for material in order_data.materials:
        table_name = "study_example" if material.get("is_example", False) else "study_materials"
        id_field = "example_id" if material.get("is_example", False) else "material_id"
        id_value = material.get("id")
        if id_value is None:
            raise HTTPException(status_code=400, detail="material_id 또는 example_id가 필요합니다.")
        query = text(f"""
            UPDATE {table_name} SET "order" = :new_order WHERE {id_field} = :id
        """)
        db.execute(query, {"id": id_value, "new_order": material["order"]})
    db.commit()
    return {"message": "자료 순서가 성공적으로 업데이트되었습니다."}


# ----------------------------
# 📌 언어 관리
# ----------------------------
@router.post("/languages/create", response_model=dict)
def create_language(language_data: LanguageCreate, db: Session = Depends(get_db)):
    existing_language = db.query(Language).filter(Language.language == language_data.language).first()
    if existing_language:
        raise HTTPException(status_code=400, detail="이미 존재하는 언어입니다.")
    new_language = Language(language=language_data.language)
    db.add(new_language)
    db.commit()
    db.refresh(new_language)
    return {"message": f"언어 '{language_data.language}'가 성공적으로 추가되었습니다.", "language_id": new_language.language_id}


@router.delete("/languages/{language_id}", response_model=dict)
def delete_language(language_id: int, db: Session = Depends(get_db)):
    language = db.query(Language).filter(Language.language_id == language_id).first()
    if not language:
        raise HTTPException(status_code=404, detail="해당 언어를 찾을 수 없습니다.")
    db.query(StudyMaterials).filter(StudyMaterials.language_id == language_id).delete()
    db.query(StudyExample).filter(StudyExample.language_id == language_id).delete()
    db.delete(language)
    db.commit()
    return {"message": f"언어 '{language.language}'와 연관된 자료가 삭제되었습니다."}


@router.put("/languages/{language_id}", response_model=dict)
def update_language(language_id: int, language_data: LanguageCreate, db: Session = Depends(get_db)):
    language = db.query(Language).filter(Language.language_id == language_id).first()
    if not language:
        raise HTTPException(status_code=404, detail="해당 언어를 찾을 수 없습니다.")
    existing_language = db.query(Language).filter(Language.language == language_data.language).first()
    if existing_language and existing_language.language_id != language_id:
        raise HTTPException(status_code=400, detail="이미 존재하는 언어입니다.")
    language.language = language_data.language
    db.commit()
    db.refresh(language)
    return {"message": f"언어가 '{language_data.language}'로 수정되었습니다.", "language_id": language.language_id}
