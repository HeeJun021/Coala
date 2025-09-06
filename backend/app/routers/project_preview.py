import subprocess
import tempfile
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

# --- Pydantic 모델 정의 ---

class CodeExecutionRequest(BaseModel):
    """코드 실행 요청을 위한 모델"""
    code: str = Field(..., description="실행할 소스 코드")

class ExecutionResult(BaseModel):
    """코드 실행 결과를 담는 모델"""
    success: bool
    stdout: str
    stderr: str

# --- API 라우터 생성 ---

router = APIRouter(
    prefix="/preview/project",
    tags=["Project Preview"],
)

# --- JavaScript 실행 엔드포인트 ---

@router.post("/js", response_model=ExecutionResult)
async def run_project_javascript(request: CodeExecutionRequest):
    """
    Node.js를 사용하여 JavaScript 코드를 서버에서 실행하고 결과를 반환합니다.
    """
    try:
        # node -e "<code>" 명령어로 코드를 직접 실행
        process = subprocess.run(
            ["node", "-e", request.code],
            capture_output=True,
            text=True,
            timeout=10  # 10초 타임아웃
        )
        success = process.returncode == 0
        return ExecutionResult(
            success=success,
            stdout=process.stdout,
            stderr=process.stderr
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="JavaScript 실행 시간이 초과되었습니다.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"JavaScript 실행 중 서버 오류 발생: {str(e)}")

# --- Python 실행 엔드포인트 ---

@router.post("/py", response_model=ExecutionResult)
async def run_project_python(request: CodeExecutionRequest):
    """
    임시 파일을 생성하여 Python 코드를 서버에서 실행하고 결과를 반환합니다.
    """
    # 임시 파일 생성 (with 블록 종료 시 자동 삭제)
    with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".py", encoding="utf-8") as temp_file:
        temp_file.write(request.code)
        temp_filename = temp_file.name

    try:
        # 생성된 임시 파이썬 파일 실행
        process = subprocess.run(
            ["python", temp_filename],
            capture_output=True,
            text=True,
            timeout=10  # 10초 타임아웃
        )
        success = process.returncode == 0
        return ExecutionResult(
            success=success,
            stdout=process.stdout,
            stderr=process.stderr
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Python 실행 시간이 초과되었습니다.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Python 실행 중 서버 오류 발생: {str(e)}")
    finally:
        # 실행 후 임시 파일 확실히 삭제
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
