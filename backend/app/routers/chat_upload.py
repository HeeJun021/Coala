from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import os
from uuid import uuid4

router = APIRouter()

# 저장할 디렉토리
UPLOAD_DIR = "uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # 파일 확장자 확인
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    if not ext:
        raise HTTPException(status_code=400, detail="파일 확장자가 필요합니다.")

    # 고유한 파일 이름 생성
    unique_name = f"{uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    # 파일 저장
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # 파일 접근 URL 반환 (예시)
    file_url = f"/static/{unique_name}"

    # 이미지인지 파일인지 판별해서 같이 반환
    is_image = ext in [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]
    message_type = "image" if is_image else "file"

    return JSONResponse({
        "file_url": file_url,
        "message_type": message_type
    })
