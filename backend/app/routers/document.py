from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.document_models import ProjectDocument
from app.schemas.document_schema import DocumentCreate, DocumentUpdate, DocumentResponse

router = APIRouter(prefix="/projects", tags=["문서"])

# 🔹 전체 문서 조회
@router.get("/{project_id}/docs", response_model=list[DocumentResponse])
def get_documents(project_id: int, db: Session = Depends(get_db)):
    return db.query(ProjectDocument).filter(ProjectDocument.project_id == project_id).all()

# 🔹 문서 생성
@router.post("/{project_id}/docs", response_model=DocumentResponse)
def create_document(project_id: int, doc: DocumentCreate, db: Session = Depends(get_db)):
    new_doc = ProjectDocument(project_id=project_id, title=doc.title, content=doc.content)
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    print("생성된 문서 정보:", new_doc.project_id, new_doc.doc_id) 
    return new_doc

# 🔹 문서 상세 조회
@router.get("/{project_id}/docs/{doc_id}", response_model=DocumentResponse)
def get_document(project_id: int, doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(ProjectDocument).filter(ProjectDocument.project_id == project_id, ProjectDocument.doc_id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")
    return doc

# 🔹 문서 수정
@router.put("/{project_id}/docs/{doc_id}", response_model=DocumentResponse)
def update_document(project_id: int, doc_id: int, doc_update: DocumentUpdate, db: Session = Depends(get_db)):
    doc = db.query(ProjectDocument).filter(ProjectDocument.project_id == project_id, ProjectDocument.doc_id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")

    # None이 아닐 때만 덮어쓰기
    if doc_update.title is not None:
        doc.title = doc_update.title
    if doc_update.content is not None:
        doc.content = doc_update.content

    db.commit()
    db.refresh(doc)
    return doc

# 문서 삭제
@router.delete("/{project_id}/docs/{doc_id}")
def delete_document(project_id: int, doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(ProjectDocument).filter(ProjectDocument.project_id == project_id, ProjectDocument.doc_id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")
    db.delete(doc)
    db.commit()
    return {"message": "문서가 삭제되었습니다."}
