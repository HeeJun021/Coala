from fastapi import APIRouter, HTTPException, Depends  
from pydantic import BaseModel
import subprocess
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.auth import get_current_user
from app.services.code import get_codes_in_folder
from app.models.code import CodeFolderMapping, Code  # ← 이 줄 추가

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
    css_code = "\n".join(code.content for code in css_files)
    js_code = "\n".join(code.content for code in js_files)

    combined_html = f"""
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>{css_code}</style>
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