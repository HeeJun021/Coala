from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import subprocess

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
