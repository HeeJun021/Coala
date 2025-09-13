# app/routers/notion_templates.py
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.template import NotionTemplate
from app.services.notion_internal import get_internal_notion
from app.services.notion_ingest import fetch_all_children

router = APIRouter(prefix="/templates", tags=["Templates"])

class IngestBody(BaseModel):
    page_id: str = Field(...)
    key: str = Field(...)
    title: str = Field(...)
    description: str = Field(default="")

@router.post("/ingest")
def ingest_template(body: IngestBody, db: Session = Depends(get_db)):
    notion = get_internal_notion()
    blocks = fetch_all_children(notion, body.page_id)
    if not blocks:
        raise HTTPException(400, "No blocks found or not shared with Integration")

    tpl = db.query(NotionTemplate).filter(NotionTemplate.key == body.key).first()
    if not tpl:
        tpl = NotionTemplate(
            key=body.key, title=body.title, description=body.description, version=1, doc_json=blocks
        )
        db.add(tpl)
    else:
        tpl.title = body.title
        tpl.description = body.description
        tpl.version += 1
        tpl.doc_json = blocks
    db.commit()
    return {"ok": True, "template_id": tpl.id, "version": tpl.version, "blocks_count": len(blocks)}

@router.get("/")
def list_templates(db: Session = Depends(get_db)):
    items = db.query(NotionTemplate).order_by(NotionTemplate.id.desc()).all()
    return [
        {
            "id": t.id,
            "key": t.key,
            "title": t.title,
            "version": t.version,
            "description": t.description,
        }
        for t in items
    ]


@router.get("/{template_id}")
def get_template(template_id: int, db: Session = Depends(get_db)):
    t = db.query(NotionTemplate).filter(NotionTemplate.id == template_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    return {
        "id": t.id,
        "key": t.key,
        "title": t.title,
        "version": t.version,
        "description": t.description,
        "doc_json": t.doc_json,
    }