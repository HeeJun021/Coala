# app/routers/code_templates.py

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers.auth import get_current_user
from app.services.template_service import materialize_template
from app.templates.catalog import TEMPLATE_CATALOG  # 필요하면 목록 노출용으로 사용

router = APIRouter(
    prefix="/freecode/templates",
    tags=["FreeCode Templates"]
)

class MaterializeRequest(BaseModel):
    template_id: str = Field(..., examples=["react", "vanilla"])
    folder_name: str | None = Field(None, description="루트 하위에 생성될 최상위 폴더명(없으면 템플릿 기본명)")
    overwrite: bool = Field(False, description="동일 폴더명이 있을 경우 덮어쓰기 여부(기본 False: -2 suffix)")

class OpenFile(BaseModel):
    code_id: int
    path: str

class MaterializeResponse(BaseModel):
    top_folder_id: int
    created_folders: list[dict]
    created_files: list[dict]
    open_files: list[OpenFile] = []

@router.post("/materialize", response_model=MaterializeResponse, status_code=status.HTTP_201_CREATED)
def materialize_template_route(
    body: MaterializeRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        top_folder_id, created_folders, created_files = materialize_template(
            db,
            user=current_user,
            template_id=body.template_id,
            folder_name=body.folder_name,
            overwrite=body.overwrite,
        )

        # (선택) 서버 추천 open_files: catalog의 open_files를 path 끝-파일명 기준으로 매칭
        open_files_resp: list[OpenFile] = []
        spec = TEMPLATE_CATALOG.get(body.template_id, {})
        wanted = set(spec.get("open_files", []))
        if wanted:
            for f in created_files:
                name = f["path"].split("/")[-1]
                if name in wanted:
                    open_files_resp.append(OpenFile(code_id=f["code_id"], path=f["path"]))

        return MaterializeResponse(
            top_folder_id=top_folder_id,
            created_folders=created_folders,
            created_files=created_files,
            open_files=open_files_resp
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to materialize template")
