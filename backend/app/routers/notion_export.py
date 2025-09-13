import os
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from cryptography.fernet import Fernet

from app.database import get_db
from app.models.user import User
from app.models.template import NotionTemplate, NotionExportHistory
from app.dependencies.auth import get_current_user
from app.services.notion_client import NotionClient
from app.services.template_fill import fill_blocks

router = APIRouter(prefix="/export", tags=["Export"])
FERNET = Fernet(os.getenv("FERNET_SECRET").encode())

def _get_user_token(user: User) -> str:
    if not user or not user.notion_token:
        raise HTTPException(status_code=401, detail="Notion not connected")
    try:
        return FERNET.decrypt(user.notion_token.encode()).decode()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to decrypt Notion token")

# TODO: 실제 프로젝트 DB/AI 연결
def _fetch_project_context(project_id: int, db: Session) -> Dict[str, Any]:
    return {
        "project": {
            "name": "샘플 프로젝트",
            "role": "Backend Engineer",
            "period": "2024.03 ~ 2024.10",
            "tech_stack": "FastAPI, PostgreSQL, Notion API",
            "summary": "포트폴리오 자동 생성 파이프라인 구축",
            "highlights": "- OAuth 퍼블릭 인테그레이션\n- 템플릿 치환\n- 내보내기 이력 관리",
        }
    }

@router.post("")
def export_template(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    body:
    {
      "template_id": 1,
      "target_page_id": "user_shared_page_id",
      "project_id": 123
    }
    """
    template_id = payload.get("template_id")
    target_page_id = payload.get("target_page_id")
    project_id = payload.get("project_id")

    if not template_id or not target_page_id:
        raise HTTPException(400, "template_id and target_page_id are required")

    tpl = db.query(NotionTemplate).filter(NotionTemplate.id == template_id).first()
    if not tpl:
        raise HTTPException(404, "Template not found")

    token = _get_user_token(current_user)
    notion = NotionClient(token)

    # 1) 컨텍스트 구성 (DB/AI 연결 포인트)
    ctx = _fetch_project_context(project_id, db)

    # 2) 자리표시자 치환
    processed_children = fill_blocks(tpl.doc_json, ctx)

    # 3) 사용자 공유 페이지에 붙여넣기
    res = notion.append_children(target_page_id, processed_children)

    # 4) 이력 저장
    hist = NotionExportHistory(
        user_id=current_user.user_id,
        template_id=tpl.id,
        target_page_id=target_page_id,
        created_page_id=None
    )
    db.add(hist); db.commit()

    return {"ok": True, "appended": len(processed_children), "result": res}
