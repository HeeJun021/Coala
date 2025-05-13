from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from typing import List
import os
from uuid import uuid4
from datetime import datetime

router = APIRouter()

# 저장할 디렉토리
UPLOAD_DIR = "uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 한번에 여러 파일 업로드까지 지원
@router.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    results = []

    for file in files:
        filename = file.filename
        ext = os.path.splitext(filename)[1].lower()
        if not ext:
            raise HTTPException(status_code=400, detail="파일 확장자가 필요합니다.")

        unique_name = f"{uuid4().hex}{ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)

        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        file_url = f"/static/{unique_name}"
        is_image = ext in [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]
        message_type = "image" if is_image else "file"
        uploaded_at = datetime.utcnow().isoformat()
        file_size = len(content)

        results.append({
            "file_url": file_url,
            "message_type": message_type,
            "file_name": filename,
            "file_size": file_size,
            "uploaded_at": uploaded_at
        })

    return JSONResponse(results)
