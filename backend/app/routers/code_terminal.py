from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import subprocess
import json
import platform
import tempfile
import os
import traceback
import threading

router = APIRouter()

@router.websocket("/ws/terminal")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("📡 WebSocket 연결됨")

    async def send_output(output):
        await websocket.send_text(output)

    def run_python_code(code):
        try:
            with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as tmpfile:
                tmpfile.write(code)
                tmp_path = tmpfile.name

            process = subprocess.Popen(
                ["python", tmp_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            stdout, stderr = process.communicate()

            if stdout:
                asyncio.run(send_output(stdout))
            if stderr:
                asyncio.run(send_output(stderr))

        except Exception as e:
            asyncio.run(send_output(f"🔥 Python 실행 에러: {str(e)}"))
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                language = payload.get("language", "").lower()
                code = payload.get("code")

                if not code:
                    await websocket.send_text("❗️ 코드가 비어있습니다.")
                    continue

                if language == "javascript":
                    process = await asyncio.create_subprocess_exec(
                        "node", "-e", code,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    stdout, stderr = await process.communicate()
                    if stdout:
                        await websocket.send_text(stdout.decode())
                    if stderr:
                        await websocket.send_text(stderr.decode())

                elif language == "python":
                    # Windows는 동기로 실행
                    if platform.system() == "Windows":
                        threading.Thread(target=run_python_code, args=(code,)).start()
                    else:
                        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as tmpfile:
                            tmpfile.write(code)
                            tmp_path = tmpfile.name

                        process = await asyncio.create_subprocess_exec(
                            "python3", tmp_path,
                            stdout=asyncio.subprocess.PIPE,
                            stderr=asyncio.subprocess.PIPE
                        )
                        stdout, stderr = await process.communicate()
                        if stdout:
                            await websocket.send_text(stdout.decode())
                        if stderr:
                            await websocket.send_text(stderr.decode())
                        os.remove(tmp_path)

                else:
                    await websocket.send_text(f"❌ 지원하지 않는 언어입니다: {language}")

            except Exception as e:
                error_message = f"🔥 서버 실행 에러: {str(e)}"
                print(error_message)
                traceback.print_exc()
                await websocket.send_text(error_message)

    except WebSocketDisconnect:
        print("❗️ WebSocket 연결 종료됨")
