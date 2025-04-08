from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.code_executor import run_python_docker, run_node_docker, read_logs
import json

router = APIRouter()

@router.websocket("/ws/terminal")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    container = None
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            language = payload.get("language", "").lower()
            encoded_code = payload.get("code")

            if language == "python":
                container, error = await run_python_docker(encoded_code)
            elif language == "javascript":
                container, error = await run_node_docker(encoded_code)
            else:
                await websocket.send_text(f"❌ 지원하지 않는 언어입니다: {language}")
                continue

            if error:
                await websocket.send_text(error)
                continue

            await read_logs(container, websocket)

    except WebSocketDisconnect:
        if container:
            container.remove(force=True)
