from fastapi import APIRouter

router = APIRouter(prefix="/project-code", tags=["Project Code"])

@router.get("/ping")
def ping():
    return {"ok": True}