# app/routers/templates.py
from datetime import datetime, date
from pathlib import Path
from typing import List, Any, Dict, Optional
import os
import json
from copy import deepcopy

import requests
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.orm import Session

# deps
from app.database import get_db
from app.dependencies.auth import get_current_user

# models
from app.models.project_models import Project, ProjectMembers, ProjectActivityLog
from app.models.templates_models import ProjectTemplate, TemplateLibrary
from app.models.user import User

# schemas (프로젝트에 있는 스키마들에 맞춰 최소한만 사용)
from app.schemas.templates_schemas import (
    ProjectTemplateCreateRequest,
    ProjectTemplateUpdateRequest,
    ProjectTemplateResponse,
)

router = APIRouter(tags=["Templates & Library"])

# ============================================================
# 공통 유틸
# ============================================================
def _get_project_or_404(db: Session, project_id: int) -> Project:
    proj = db.query(Project).filter(Project.project_id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    return proj

def _assert_leader(db: Session, project_id: int, user: User):
    leader = (
        db.query(ProjectMembers)
        .filter(
            ProjectMembers.project_id == project_id,
            ProjectMembers.user_id == user.user_id,
            ProjectMembers.is_leader.is_(True),
        )
        .first()
    )
    if not leader:
        raise HTTPException(status_code=403, detail="Only leader can perform this action")

def _resolve_str(s: str, ctx: Dict[str, Any]) -> str:
    out = s
    for k, v in {
        "{{project.name}}": ctx["project"]["name"],
        "{{owner.nickname}}": ctx["owner"]["nickname"],
        "{{today}}": ctx["today"],
    }.items():
        out = out.replace(k, str(v))
    return out

def _walk_and_resolve(obj, ctx):
    if isinstance(obj, dict):
        return {k: _walk_and_resolve(v, ctx) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_walk_and_resolve(x, ctx) for x in obj]
    if isinstance(obj, str):
        return _resolve_str(obj, ctx)
    return obj

def _derive_widgets(blocks: dict) -> list[str]:
    widgets: list[str] = []
    if not isinstance(blocks, dict):
        return widgets
    layout = blocks.get("layout") or []
    items = blocks.get("items") or {}
    for key in layout:
        t = (items.get(key) or {}).get("type")
        if t and t not in widgets:
            widgets.append(t)
    return widgets

def _activity(db: Session, project_id: int, user: User, action: str):
    db.add(
        ProjectActivityLog(
            project_id=project_id,
            actor_id=user.user_id,
            action=action,
            created_at=datetime.now(),
        )
    )

# ============================================================
# 파일 기반 카탈로그 (seed/토큰 없이 사용)
# ============================================================
CATALOG_FILE = os.getenv(
    "TEMPLATE_CATALOG_FILE",
    str(Path(__file__).resolve().parents[2] / "seeds" / "template_catalog.json")
)

def _load_catalog() -> List[dict]:
    p = Path(CATALOG_FILE)
    if not p.exists():
        raise HTTPException(status_code=500, detail=f"Catalog file not found: {p}")
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            raise ValueError("Catalog JSON must be a list")
        out = []
        for i, it in enumerate(data, start=1):
            out.append({
                "id": i,
                "title": it.get("title"),
                "description": it.get("description"),
                "category": it.get("category"),
                "tags": it.get("tags"),
                "thumbnail_url": it.get("thumbnail_url"),
                "version": it.get("version", 1),
                "is_published": bool(it.get("is_published", True)),
                "blocks": it.get("blocks"),
            })
        return out
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Invalid catalog: {e}")

@router.get("/template-catalog")
def list_template_catalog():
    items = _load_catalog()
    return [{k: v for k, v in it.items() if k != "blocks"} for it in items]

@router.get("/template-catalog/{catalog_id}")
def get_template_catalog_item(catalog_id: int):
    items = _load_catalog()
    for it in items:
        if it["id"] == catalog_id:
            return it
    raise HTTPException(status_code=404, detail="Catalog item not found")

@router.post("/projects/{project_id}/templates/from-catalog", response_model=ProjectTemplateResponse)
def create_template_from_catalog(
    project_id: int,
    catalog_id: int = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_project_or_404(db, project_id)
    _assert_leader(db, project_id, current_user)

    items = _load_catalog()
    pick = next((it for it in items if it["id"] == catalog_id), None)
    if not pick:
        raise HTTPException(status_code=404, detail="Catalog item not found")

    ctx = {
        "project": {"name": project.name, "id": project.project_id},
        "owner": {"nickname": current_user.nickname, "id": current_user.user_id},
        "today": date.today().isoformat(),
    }
    blocks_resolved = _walk_and_resolve(deepcopy(pick.get("blocks") or {}), ctx)

    pt = ProjectTemplate(
        project_id=project.project_id,
        title=pick["title"],
        description=pick.get("description"),
        library_id=None,
        applied_blocks=blocks_resolved,
        widgets=_derive_widgets(blocks_resolved),
    )
    db.add(pt)
    _activity(db, project_id, current_user, f"{current_user.nickname}이(가) 파일 카탈로그 템플릿 '{pick['title']}' 적용")
    db.commit()
    db.refresh(pt)
    return pt

# ============================================================
# DB 라이브러리 (선택)
# ============================================================
@router.get("/template-library")
def list_template_library(
    published: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(TemplateLibrary)
    if published == 1:
        q = q.filter(TemplateLibrary.is_published.is_(True))
    rows = q.order_by(TemplateLibrary.id.desc()).all()
    return rows

@router.get("/template-library/{library_id}")
def get_template_library_item(
    library_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lib = db.query(TemplateLibrary).get(library_id)
    if not lib:
        raise HTTPException(status_code=404, detail="Library item not found")
    return {
        "id": lib.id,
        "title": lib.title,
        "description": lib.description,
        "category": lib.category,
        "tags": lib.tags,
        "thumbnail_url": lib.thumbnail_url,
        "version": lib.version,
        "is_published": lib.is_published,
        "blocks": lib.blocks,
    }

@router.post("/projects/{project_id}/templates/from-library", response_model=ProjectTemplateResponse)
def apply_from_library(
    project_id: int,
    library_id: int = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_project_or_404(db, project_id)
    _assert_leader(db, project_id, current_user)

    lib = db.query(TemplateLibrary).get(library_id)
    if not lib or not lib.is_published:
        raise HTTPException(status_code=404, detail="Library template not found")

    ctx = {
        "project": {"name": project.name, "id": project.project_id},
        "owner": {"nickname": current_user.nickname, "id": current_user.user_id},
        "today": date.today().isoformat(),
    }
    blocks_resolved = _walk_and_resolve(deepcopy(lib.blocks or {}), ctx)

    pt = ProjectTemplate(
        project_id=project.project_id,
        title=lib.title,
        description=lib.description,
        library_id=lib.id,
        applied_blocks=blocks_resolved,
        widgets=_derive_widgets(blocks_resolved),
    )
    db.add(pt)
    _activity(db, project_id, current_user, f"{current_user.nickname}이(가) 라이브러리 템플릿 '{lib.title}' 적용")
    db.commit()
    db.refresh(pt)
    return pt

# ============================================================
# 프로젝트 템플릿 CRUD (기존 기능)
# ============================================================
@router.get("/projects/{project_id}/templates", response_model=List[ProjectTemplateResponse])
def list_project_templates(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_project_or_404(db, project_id)
    rows = (
        db.query(ProjectTemplate)
        .filter(ProjectTemplate.project_id == project_id)
        .order_by(ProjectTemplate.template_id.desc())
        .all()
    )
    return rows

@router.get("/projects/{project_id}/templates/{template_id}", response_model=ProjectTemplateResponse)
def get_project_template(
    project_id: int,
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_project_or_404(db, project_id)
    t = (
        db.query(ProjectTemplate)
        .filter(ProjectTemplate.project_id == project_id,
                ProjectTemplate.template_id == template_id)
        .first()
    )
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    return t

@router.post("/projects/{project_id}/templates", response_model=ProjectTemplateResponse)
def create_project_template(
    project_id: int,
    payload: ProjectTemplateCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_project_or_404(db, project_id)
    _assert_leader(db, project_id, current_user)
    t = ProjectTemplate(
        project_id=project_id,
        title=payload.title,
        description=payload.description,
        widgets=payload.widgets or [],
    )
    db.add(t)
    _activity(db, project_id, current_user, f"{current_user.nickname}이(가) 템플릿 '{payload.title}' 추가")
    db.commit()
    db.refresh(t)
    return t

@router.patch("/projects/{project_id}/templates/{template_id}", response_model=ProjectTemplateResponse)
def update_project_template(
    project_id: int,
    template_id: int,
    payload: ProjectTemplateUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_project_or_404(db, project_id)
    _assert_leader(db, project_id, current_user)
    t = (
        db.query(ProjectTemplate)
        .filter(ProjectTemplate.project_id == project_id,
                ProjectTemplate.template_id == template_id)
        .first()
    )
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    if payload.title is not None:
        t.title = payload.title.strip() or t.title
    if payload.description is not None:
        t.description = payload.description
    if payload.widgets is not None:
        t.widgets = payload.widgets
    if payload.applied_blocks is not None:
        t.applied_blocks = payload.applied_blocks
    db.commit()
    db.refresh(t)
    return t

@router.delete("/projects/{project_id}/templates/{template_id}")
def delete_project_template(
    project_id: int,
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_project_or_404(db, project_id)
    _assert_leader(db, project_id, current_user)
    t = (
        db.query(ProjectTemplate)
        .filter(ProjectTemplate.project_id == project_id,
                ProjectTemplate.template_id == template_id)
        .first()
    )
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    _activity(db, project_id, current_user, f"{current_user.nickname}이(가) 템플릿 '{t.title}' 삭제")
    db.delete(t)
    db.commit()
    return {"ok": True}

# ============================================================
# 외부 제공처에서 “바로 가져와 적용” (가장 중요)
# ============================================================

# ---- Trello → Kanban --------------------------------------
TRELLO_KEY = os.getenv("TRELLO_KEY")
TRELLO_TOKEN = os.getenv("TRELLO_TOKEN")

def _trello_board_id_from_url_or_id(board: str) -> str:
    # https://trello.com/b/{shortlink}/{name} 또는 shortlink 둘 다 허용
    if "/" in board:
        parts = board.rstrip("/").split("/")
        return parts[-2] if len(parts) >= 2 else parts[-1]
    return board

def _trello_to_blocks(board_short: str) -> dict:
    if not TRELLO_KEY or not TRELLO_TOKEN:
        raise HTTPException(status_code=400, detail="Missing TRELLO_KEY/TRELLO_TOKEN")
    base = f"https://api.trello.com/1/boards/{board_short}/lists"
    r = requests.get(base, params={"cards": "open", "card_fields": "name,desc",
                                   "key": TRELLO_KEY, "token": TRELLO_TOKEN})
    if r.status_code >= 400:
        raise HTTPException(status_code=400, detail=f"Trello error: {r.text}")
    lists = r.json()
    columns = [lst["name"] for lst in lists]
    seed = []
    for lst in lists:
        for card in lst.get("cards", []):
            seed.append({"title": card.get("name",""), "column": lst["name"]})
    return {
        "layout": ["kanban:board"],
        "items": {
            "kanban:board": {
                "type": "kanban",
                "title": "Kanban from Trello",
                "columns": columns,
                "seedCards": seed,
            }
        }
    }

@router.post("/projects/{project_id}/templates/import/trello", response_model=ProjectTemplateResponse)
def import_from_trello(
    project_id: int,
    board: str = Body(..., embed=True, description="보드 URL 또는 shortlink"),
    title: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_project_or_404(db, project_id)
    _assert_leader(db, project_id, current_user)
    short = _trello_board_id_from_url_or_id(board)
    blocks = _trello_to_blocks(short)
    ctx = {
        "project": {"name": project.name, "id": project.project_id},
        "owner": {"nickname": current_user.nickname, "id": current_user.user_id},
        "today": date.today().isoformat(),
    }
    resolved = _walk_and_resolve(blocks, ctx)
    pt = ProjectTemplate(
        project_id=project.project_id,
        title=title or "Agile Kanban",
        description="Imported from Trello",
        library_id=None,
        applied_blocks=resolved,
        widgets=_derive_widgets(resolved),
    )
    db.add(pt)
    _activity(db, project_id, current_user, "Trello 보드에서 템플릿 가져와 적용")
    db.commit()
    db.refresh(pt)
    return pt

# ---- GitHub Issue Forms → 문서/체크리스트 -------------------
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

def _github_issue_forms_to_blocks(owner: str, repo: str) -> dict:
    headers = {"Accept": "application/vnd.github+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"

    # 디렉토리 리스트
    r = requests.get(
        f"https://api.github.com/repos/{owner}/{repo}/contents/.github/ISSUE_TEMPLATE",
        headers=headers,
    )
    if r.status_code == 404:
        raise HTTPException(status_code=404, detail="ISSUE_TEMPLATE not found")
    if r.status_code >= 400:
        raise HTTPException(status_code=400, detail=f"GitHub error: {r.text}")
    entries = r.json()

    try:
        import yaml  # PyYAML
    except Exception:
        raise HTTPException(status_code=400, detail="PyYAML not installed. pip install pyyaml")

    layout: List[str] = []
    items: Dict[str, Any] = {}

    for e in entries:
        name = e.get("name","")
        if not name.endswith((".yml", ".yaml")):
            continue
        # 파일 내용
        r2 = requests.get(e["download_url"], headers=headers)
        if r2.status_code >= 400:
            raise HTTPException(status_code=400, detail=f"GitHub raw error: {r2.text}")
        form = yaml.safe_load(r2.text)
        form_name = (form.get("name") or "Issue").strip()
        key_doc = f"doc:{form_name.lower().replace(' ','-')}"
        body_lines = [f"# {form_name}"]
        checklist_items: List[str] = []

        for el in form.get("body", []):
            t = el.get("type")
            attr = el.get("attributes", {})
            label = attr.get("label","").strip()
            if t == "markdown":
                body_lines.append(attr.get("value",""))
            elif t == "textarea":
                body_lines.append(f"## {label}\n")
            elif t == "input":
                body_lines.append(f"- {label}: ")
            elif t == "checkboxes":
                for opt in attr.get("options", []):
                    checklist_items.append(opt.get("label",""))

        items[key_doc] = {"type":"doc","title":form_name,"content":"\n".join(body_lines)}
        layout.append(key_doc)
        if checklist_items:
            key_ck = f"checklist:{form_name.lower().replace(' ','-')}"
            items[key_ck] = {"type":"checklist","title":"체크리스트","items": checklist_items}
            layout.append(key_ck)

    if not layout:
        raise HTTPException(status_code=404, detail="No YAML forms found")

    return {"layout": layout, "items": items}

@router.post("/projects/{project_id}/templates/import/github-issue-forms", response_model=ProjectTemplateResponse)
def import_from_github_issue_forms(
    project_id: int,
    owner: str = Body(..., embed=True),
    repo: str = Body(..., embed=True),
    title: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_project_or_404(db, project_id)
    _assert_leader(db, project_id, current_user)
    blocks = _github_issue_forms_to_blocks(owner, repo)
    ctx = {
        "project": {"name": project.name, "id": project.project_id},
        "owner": {"nickname": current_user.nickname, "id": current_user.user_id},
        "today": date.today().isoformat(),
    }
    resolved = _walk_and_resolve(blocks, ctx)
    pt = ProjectTemplate(
        project_id=project.project_id,
        title=title or f"{owner}/{repo} Issue Forms",
        description="Imported from GitHub Issue Forms",
        library_id=None,
        applied_blocks=resolved,
        widgets=_derive_widgets(resolved),
    )
    db.add(pt)
    _activity(db, project_id, current_user, "GitHub Issue Forms에서 템플릿 가져와 적용")
    db.commit()
    db.refresh(pt)
    return pt

# ---- Notion → 블록 트리(문서/체크리스트/테이블) -------------------
NOTION_TOKEN = os.getenv("NOTION_TOKEN")
NOTION_VERSION = "2022-06-28"

def _notion_headers():
    if not NOTION_TOKEN:
        raise HTTPException(status_code=400, detail="Missing NOTION_TOKEN")
    return {
        "Authorization": f"Bearer {NOTION_TOKEN}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }

def _notion_children(block_id: str) -> List[dict]:
    url = f"https://api.notion.com/v1/blocks/{block_id}/children?page_size=100"
    r = requests.get(url, headers=_notion_headers())
    if r.status_code >= 400:
        raise HTTPException(status_code=400, detail=f"Notion error: {r.text}")
    data = r.json()
    results = data.get("results", [])
    # 간단: 재귀 1 depth만 (필요시 확장)
    return results

def _notion_to_blocks(page_id: str) -> dict:
    # page 자체의 children 읽기
    results = _notion_children(page_id.replace("-", ""))

    layout: List[str] = []
    items: Dict[str, Any] = {}

    def add_doc(title: str, content: str):
        key = f"doc:{len(items)+1}"
        items[key] = {"type":"doc","title":title, "content":content}
        layout.append(key)

    def add_checklist(title: str, arr: List[str]):
        key = f"checklist:{len(items)+1}"
        items[key] = {"type":"checklist","title":title, "items": arr}
        layout.append(key)

    def add_table(title: str, columns: List[str], rows: List[List[str]]):
        key = f"table:{len(items)+1}"
        items[key] = {"type":"table", "title":title, "columns":columns, "rows": rows}
        layout.append(key)

    # 매우 간단한 매핑(heading/paragraph/to_do/table)
    doc_buf: List[str] = []
    for b in results:
        t = b.get("type")
        if t in ("heading_1","heading_2","heading_3"):
            if doc_buf:
                add_doc("문서", "\n".join(doc_buf)); doc_buf = []
            txt = "".join([x.get("plain_text","") for x in b[t].get("rich_text",[])])
            add_doc(txt or "제목", "")
        elif t == "paragraph":
            txt = "".join([x.get("plain_text","") for x in b[t].get("rich_text",[])])
            doc_buf.append(txt)
        elif t == "to_do":
            txt = "".join([x.get("plain_text","") for x in b[t].get("rich_text",[])])
            add_checklist("체크리스트", [txt] if txt else [])
        elif t == "table":
            # 간소화: Notion table children 추출 (헤더/행)
            rows = _notion_children(b["id"])
            columns = []
            values: List[List[str]] = []
            for row in rows:
                if row.get("type") != "table_row": continue
                cells = row["table_row"]["cells"]
                texts = ["".join([rt.get("plain_text","") for rt in cell]) for cell in cells]
                if not columns:
                    columns = texts
                else:
                    values.append(texts)
            add_table("표", columns or [], values)
        else:
            # 기타 블록은 현재 스킵
            pass
    if doc_buf:
        add_doc("문서", "\n".join(doc_buf))

    if not layout:
        raise HTTPException(status_code=404, detail="Notion page has no supported blocks")

    return {"layout": layout, "items": items}

@router.post("/projects/{project_id}/templates/import/notion", response_model=ProjectTemplateResponse)
def import_from_notion(
    project_id: int,
    page_id: str = Body(..., embed=True, description="Notion 페이지 ID (URL 가능)"),
    title: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = _get_project_or_404(db, project_id)
    _assert_leader(db, project_id, current_user)

    # URL이면 마지막 UUID 추출
    pid = page_id
    if "/" in page_id:
        pid = page_id.rstrip("/").split("/")[-1]
    blocks = _notion_to_blocks(pid)
    ctx = {
        "project": {"name": project.name, "id": project.project_id},
        "owner": {"nickname": current_user.nickname, "id": current_user.user_id},
        "today": date.today().isoformat(),
    }
    resolved = _walk_and_resolve(blocks, ctx)
    pt = ProjectTemplate(
        project_id=project.project_id,
        title=title or "Notion Import",
        description="Imported from Notion",
        library_id=None,
        applied_blocks=resolved,
        widgets=_derive_widgets(resolved),
    )
    db.add(pt)
    _activity(db, project_id, current_user, "Notion 페이지에서 템플릿 가져와 적용")
    db.commit()
    db.refresh(pt)
    return pt
