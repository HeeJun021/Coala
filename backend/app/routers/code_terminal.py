from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import subprocess
import json

router = APIRouter()

@router.websocket("/ws/terminal")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            language = payload.get("language", "").lower()
            code = payload.get("code")
            input_text = payload.get("input", "")

            if language == "javascript":
                cmd = ["node", "-e", code]
            elif language == "python":
                cmd = ["python3", "-c", code]
            else:
                await websocket.send_text(f"❌ 지원하지 않는 언어입니다: {language}")
                continue


            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate(input=input_text.encode())

            if stdout:
                await websocket.send_text(stdout.decode(errors="ignore"))
            if stderr:
                await websocket.send_text(stderr.decode(errors="ignore"))

            await websocket.close()

    except WebSocketDisconnect:
        print("WebSocket 연결 종료")
