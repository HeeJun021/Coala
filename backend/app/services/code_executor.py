import subprocess
import uuid
import os

LANGUAGE_CONFIG = {
    "python": {
        "image": "python:3.10-slim",
        "file_name": "main.py",
        "run_cmd": "python main.py",
    },
    "javascript": {
        "image": "node:18-slim",
        "file_name": "main.js",
        "run_cmd": "node main.js",
    },
    "java": {
        "image": "openjdk:17-slim",
        "file_name": "Main.java",
        "run_cmd": "javac Main.java && java Main",
    },
}

TEMP_DIR = "/tmp/code-exec"
os.makedirs(TEMP_DIR, exist_ok=True)


async def execute_code(code: str, language: str, input_data: str = ""):
    if language not in LANGUAGE_CONFIG:
        return {"stdout": "", "stderr": "Unsupported language."}

    config = LANGUAGE_CONFIG[language]
    unique_id = str(uuid.uuid4())[:8]
    temp_path = f"{TEMP_DIR}/{unique_id}"
    os.makedirs(temp_path, exist_ok=True)

    file_path = f"{temp_path}/{config['file_name']}"
    with open(file_path, "w") as f:
        f.write(code)

    host_path = os.path.abspath(temp_path).replace("\\", "/")

    docker_cmd = [
    "docker", "run", "--rm",
    "-v", f"{host_path}:/app",
    "-w", "/app",
    config["image"],
    "sh", "-c", f'echo "{input_data}" | {config["run_cmd"]}'
]


    try:
        result = subprocess.run(
            docker_cmd,
            input=input_data,
            capture_output=True,
            text=True,
            timeout=10
        )
        stdout = result.stdout
        stderr = result.stderr
    except subprocess.TimeoutExpired:
        stdout = ""
        stderr = "Execution timed out."

    # 임시 파일 삭제
    try:
        os.remove(file_path)
        os.rmdir(temp_path)
    except Exception:
        pass

    return {"stdout": stdout, "stderr": stderr}
