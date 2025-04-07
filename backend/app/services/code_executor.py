import docker
import base64
import tempfile
import os
import re
from pathlib import Path

client = docker.from_env()

async def run_python_docker(encoded_code: str):
    try:
        code = base64.b64decode(encoded_code).decode("utf-8")
        container = client.containers.run(
            image="code-exec-python",
            command=["python", "-u", "-c", code],
            stdin_open=True,
            stdout=True,
            stderr=True,
            tty=False,
            detach=True,
        )
        return container, None
    except Exception as e:
        return None, f"❗️ 실행 중 에러 발생: {str(e)}"

async def read_logs(container, websocket):
    try:
        for log in container.logs(stream=True, stdout=True, stderr=True):
            await websocket.send_text(log.decode())
    except Exception as e:
        await websocket.send_text(f"🔥 로그 읽기 에러: {str(e)}")

async def run_node_docker(encoded_code: str):
    try:
        raw_code = base64.b64decode(encoded_code).decode("utf-8")
        print("Decoded code:", raw_code)  # 디코딩된 코드 출력

        # <script> 태그 내 코드 추출
        if "<script" in raw_code.lower():
            match = re.search(r"<script[^>]*>([\s\S]*?)<\/script>", raw_code, re.IGNORECASE)
            if match:
                code = match.group(1).strip()
            else:
                return None, "❗️ <script> 태그가 있지만 코드 추출에 실패했습니다."
        else:
            code = raw_code

        if not code:
            return None, "❗️ 실행할 JavaScript 코드가 비어있습니다."

        # jsdom으로 DOM 환경 설정 코드 추가
        jsdom_setup = """
        const { JSDOM } = require('jsdom');
        const dom = new JSDOM();
        global.document = dom.window.document;
        global.window = dom.window;
        global.navigator = dom.window.navigator;
        """

        # 최종 실행 코드: jsdom 설정 + 사용자 코드
        final_code = jsdom_setup + "\n" + code

        # Docker 컨테이너에서 직접 실행
        container = client.containers.run(
            image="code-exec-node",
            command=["node", "-e", final_code],
            stdin_open=True,
            stdout=True,
            stderr=True,
            tty=False,
            detach=True,
        )
        return container, None
    except Exception as e:
        print("Error details:", str(e))
        return None, f"❗️ 실행 중 에러 발생: {str(e)}"