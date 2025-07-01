import os
import subprocess
from fastapi import APIRouter, WebSocket, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from tempfile import NamedTemporaryFile
from app.services.code_terminal_executor import run_python_docker, run_node_docker, read_logs
from app.database import get_db
from app.services.code_executor import execute_code
from app.services.coding_test_case_service import get_testcases

router = APIRouter(prefix="/code-exec", tags=["Code Execution"])


# REST API 방식 - 코딩 테스트용 채점 실행
class CodeRequest(BaseModel):
    code: str
    language: str

@router.post("/run/{test_id}")
async def run_code_with_testcases(
    test_id: int, request: CodeRequest, db: Session = Depends(get_db)
):
    testcases = get_testcases(db, test_id, type="public")
    results = []

    for case in testcases:
        result = await execute_code(
            request.code, request.language, input_data=case["input"]
        )
        results.append({
            "input": case["input"],
            "expected_output": case["expected_output"],
            "actual_output": result["stdout"].strip(),
            "passed": result["stdout"].strip() == case["expected_output"].strip(),
            "stderr": result["stderr"],
        })

    return {"results": results}


# WebSocket 방식 - 실시간 터미널 코드 실행
@router.websocket("/execute")
async def execute_code_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_json()
        language = data.get("language")
        code = data.get("code")
        user_input = data.get("input", "")

        language_settings = {
            "python": {"ext": ".py", "cmd": "python3"},
            "javascript": {"ext": ".js", "cmd": "node"}
        }

        if language not in language_settings:
            await websocket.send_text(f"Unsupported language: {language}")
            await websocket.close()
            return

        ext = language_settings[language]["ext"]
        cmd = language_settings[language]["cmd"]

        with NamedTemporaryFile(mode="w+", suffix=ext, delete=False) as tmp:
            tmp.write(code)
            tmp.flush()
            tmp_path = tmp.name

        run_cmd = [cmd, tmp_path]
        process = subprocess.Popen(
            run_cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        stdout, stderr = process.communicate(input=user_input)
        result = stdout + ("\n" + stderr if stderr else "")
        await websocket.send_text(result)

        os.remove(tmp_path)

    except Exception as e:
        await websocket.send_text(f"Error: {str(e)}")
    finally:
        await websocket.close()
