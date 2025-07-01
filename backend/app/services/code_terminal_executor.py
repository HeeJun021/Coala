# app/services/code_terminal_executor.py

import docker
import base64
import re

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
        return None, f"실행 중 에러 발생: {str(e)}"

async def read_logs(container, websocket):
    try:
        for log in container.logs(stream=True, stdout=True, stderr=True):
            await websocket.send_text(log.decode())
    except Exception as e:
        await websocket.send_text(f"로그 읽기 에러: {str(e)}")

async def run_node_docker(encoded_code: str):
    try:
        raw_code = base64.b64decode(encoded_code).decode("utf-8")

        if "<script" in raw_code.lower():
            match = re.search(r"<script[^>]*>([\s\S]*?)<\/script>", raw_code, re.IGNORECASE)
            if match:
                code = match.group(1).strip()
            else:
                return None, "<script> 태그에서 코드 추출 실패"
        else:
            code = raw_code

        if not code:
            return None, "실행할 JavaScript 코드가 비어있습니다."

        jsdom_setup = """
        const { JSDOM } = require('jsdom');
        const dom = new JSDOM();
        global.document = dom.window.document;
        global.window = dom.window;
        global.navigator = dom.window.navigator;
        """
        final_code = jsdom_setup + "\n" + code

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
        return None, f"실행 중 에러 발생: {str(e)}"
