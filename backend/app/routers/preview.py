from fastapi import APIRouter, HTTPException, Depends  
from pydantic import BaseModel
import subprocess
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.auth import get_current_user
from app.services.code import get_codes_in_folder
from app.models.code_models import CodeFolderMapping, Code  # ← 이 줄 추가
import re, traceback, tempfile, subprocess, shutil


router = APIRouter(prefix="/preview", tags=["Preview"])

class JSCodeRequest(BaseModel):
    code: str  #"code": "console.log('Hello, JS!')" 이런 식으로 들어와야 함

@router.post("/js")
async def run_js_code(payload: JSCodeRequest):
    try:
        # Node.js로 JS 코드 실행
        process = subprocess.run(
            ["node", "-e", payload.code],
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=5  # 무한루프 방지용
        )
        return {
            "output": process.stdout,
            "error": process.stderr
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="실행 시간이 초과되었습니다.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"실행 실패: {str(e)}")
    
@router.get("/preview-html/by-code/{code_id}")
def preview_html_by_code_id(
    code_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    mapping = (
        db.query(CodeFolderMapping)
        .join(Code)
        .filter(CodeFolderMapping.code_id == code_id, Code.user_id == user["user_id"])
        .first()
    )
    if not mapping:
        raise HTTPException(status_code=404, detail="해당 코드의 폴더를 찾을 수 없습니다.")

    folder_id = mapping.folder_id
    codes = get_codes_in_folder(db=db, user=user, folder_id=folder_id)

    html_files = [code for code in codes if code.title.endswith(".html")]
    css_files = [code for code in codes if code.title.endswith(".css")]
    js_files = [code for code in codes if code.title.endswith(".js")]

    if len(html_files) != 1:
        raise HTTPException(status_code=400, detail="HTML 파일은 폴더에 하나만 존재해야 합니다.")

    html_code = html_files[0]

    # HTML 안의 <link rel="stylesheet" href="파일명.css"> 추출
    link_pattern = r'<link\s+[^>]*href=["\']([^"\']+\.css)["\']'
    linked_css_files = re.findall(link_pattern, html_code.content)

    # 실제 폴더 내 있는 css 파일들과 비교해서 일치하는 것만 사용
    matched_css_contents = []
    for filename in linked_css_files:
        for css_code in css_files:
            if css_code.title == filename:
                matched_css_contents.append(css_code.content)

    js_code = "\n".join(code.content for code in js_files)

    combined_html = f"""
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
        {'\n'.join(matched_css_contents)}
        </style>
      </head>
      <body>
        {html_code.content}
        <script>
        try {{
          {js_code}
        }} catch(e) {{
          document.body.innerHTML += '<pre style="color:red;">' + e.message + '</pre>';
        }}
        </script>
      </body>
    </html>
    """

    return {
        "srcdoc": combined_html,
        "html_filename": html_code.title
    }
    
# 실행 가능한 Python 경로 자동 탐색 함수
def find_python_executable():
    # 우선순위 1: 직접 지정한 경로
    preferred_path = r"C:\Users\user\AppData\Local\Programs\Python\Python313\python.exe"
    if shutil.which(preferred_path):
        return preferred_path

    # 우선순위 2: 일반 탐색
    invalid_paths = ["WindowsApps\\python3.EXE", "WindowsApps\\python.EXE"]
    candidates = ["python3", "python"]
    for cmd in candidates:
        path = shutil.which(cmd)
        if path and all(invalid not in path for invalid in invalid_paths):
            return path

    raise RuntimeError("⚠ Python 실행 파일을 찾을 수 없습니다.")

@router.get("/preview-python/by-code/{code_id}")
def preview_python_by_code_id(
    code_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    # 코드 및 소유자 확인
    mapping = (
        db.query(CodeFolderMapping)
        .join(Code)
        .filter(CodeFolderMapping.code_id == code_id, Code.user_id == user["user_id"])
        .first()
    )
    if not mapping:
        raise HTTPException(status_code=404, detail="해당 코드의 폴더를 찾을 수 없습니다.")

    code = db.query(Code).filter(Code.code_id == code_id).first()
    if not code or not code.title.endswith(".py"):
        raise HTTPException(status_code=400, detail="Python 파일만 실행할 수 있습니다.")

    try:
        # Python 실행 경로 탐색
        python_cmd = find_python_executable()

        # 로그: 코드 내용 확인
        print("✅ 실행할 코드:\n", code.content)

        # 임시 파일에 utf-8로 저장
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as temp_file:
            temp_file.write(code.content)
            temp_file.flush()
            temp_path = temp_file.name

        print(f"📄 Temp file path: {temp_path}")

        # subprocess로 실행
        result = subprocess.run(
            [python_cmd, temp_path],
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=5,
        )

        return {
            "success": result.returncode == 0,
            "stdout": result.stdout or "",
            "stderr": result.stderr or "",
        }

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="실행 시간이 초과되었습니다.")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"실행 실패: {repr(e)}")
