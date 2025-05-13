from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
import os

router = APIRouter()

UPLOAD_DIR = "uploaded_files"

@router.get("/download/{filename}")
def download_file(filename: str, original_name: str = Query(...)):
    file_path = os.path.join(UPLOAD_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="파일이 존재하지 않습니다.")

    return FileResponse(
        path=file_path,
        filename=original_name,  # ✅ 브라우저가 저장할 이름
        media_type="application/octet-stream"
    )
