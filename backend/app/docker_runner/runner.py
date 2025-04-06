import subprocess
import uuid
import os

# 지원 언어별 Docker 이미지
LANGUAGE_IMAGE = {
    "python": "python:3.10-slim",
    "javascript": "node:20-alpine",
    "java": "openjdk:17-slim"
}

TEMP_DIR = "/tmp/code_runner"

def run_code(code: str, language: str):
    if language not in LANGUAGE_IMAGE:
        return {"error": "Unsupported language."}

    # 임시 코드 파일 생성
    os.makedirs(TEMP_DIR, exist_ok=True)
    file_id = str(uuid.uuid4())
    file_path = f"{TEMP_DIR}/{file_id}"

    if language == "python":
        file_path += ".py"
    elif language == "javascript":
        file_path += ".js"
    elif language == "java":
        file_path += ".java"

    with open(file_path, "w") as f:
        f.write(code)

    try:
        # Docker 명령어 실행
        result = subprocess.run(
            [
                "docker", "run", "--rm",
                "-v", f"{file_path}:/app/code",
                LANGUAGE_IMAGE[language],
                "sh", "-c", get_run_command(language)
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=10  # 10초 제한
        )
        return {
            "stdout": result.stdout.decode(),
            "stderr": result.stderr.decode()
        }
    except subprocess.TimeoutExpired:
        return {"error": "실행 시간 초과"}
    finally:
        os.remove(file_path)


def get_run_command(language):
    if language == "python":
        return "python /app/code"
    elif language == "javascript":
        return "node /app/code"
    elif language == "java":
        return "javac /app/code && java -cp /app Code"
