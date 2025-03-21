from fastapi import APIRouter, HTTPException
import subprocess

router = APIRouter()

@router.post("/api/run-code")
async def run_code(data: dict):
    language = data.get("language")
    code = data.get("code")
    
    if not language or not code:
        raise HTTPException(status_code=400, detail="언어와 코드가 필요합니다.")
    
    if language.lower() == "html":
        # HTML은 실행 없이 그대로 반환
        return {"output": "HTML 미리보기 준비 완료", "html_output": code}
    elif language.lower() == "javascript":
        # JavaScript 실행 로직 (예: Node.js)
        result = subprocess.run(["node", "-e", code], capture_output=True, text=True)
        return {"output": result.stdout or result.stderr, "html_output": ""}
    elif language.lower() == "python":
        # Python 실행 로직
        result = subprocess.run(["python", "-c", code], capture_output=True, text=True)
        return {"output": result.stdout or result.stderr, "html_output": ""}
    else:
        raise HTTPException(status_code=400, detail="지원하지 않는 언어입니다.")