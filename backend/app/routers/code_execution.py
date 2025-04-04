import os
import subprocess
from fastapi import APIRouter, WebSocket
from tempfile import NamedTemporaryFile

router = APIRouter()

@router.websocket("/execute")
async def execute_code(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_json()
        language = data.get("language")
        code = data.get("code")
        user_input = data.get("input", "")

        # 언어별 실행 명령어 및 확장자 설정
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

        # 임시 파일에 코드 저장
        with NamedTemporaryFile(mode="w+", suffix=ext, delete=False) as tmp:
            tmp.write(code)
            tmp.flush()
            tmp_path = tmp.name

        # 실행 명령어 구성
        run_cmd = [cmd, tmp_path]
        process = subprocess.Popen(
            run_cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        # 입력 전달
        stdout, stderr = process.communicate(input=user_input)
        result = stdout + ("\n" + stderr if stderr else "")

        await websocket.send_text(result)
        os.remove(tmp_path)  # 임시 파일 삭제

    except Exception as e:
        await websocket.send_text(f"Error: {str(e)}")
    finally:
        await websocket.close()
