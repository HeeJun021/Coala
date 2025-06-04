import subprocess
import uuid
import os
import time  # ⏱ 실행 시간 측정용

# 언어별 실행 설정
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


# ✅ 코드 실행 함수
async def execute_code(code: str, language: str, input_data: str = ""):
    if language not in LANGUAGE_CONFIG:
        return {
            "stdout": "",
            "stderr": "Unsupported language.",
            "execution_time": 0,
            "memory_used": 0,
        }

    config = LANGUAGE_CONFIG[language]
    unique_id = str(uuid.uuid4())[:8]
    temp_path = f"{TEMP_DIR}/{unique_id}"
    os.makedirs(temp_path, exist_ok=True)

    file_path = f"{temp_path}/{config['file_name']}"
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(code)

    host_path = os.path.abspath(temp_path).replace("\\", "/")
    docker_cmd = [
        "docker",
        "run",
        "--rm",
        "-v",
        f"{host_path}:/app",
        "-w",
        "/app",
        config["image"],
        "sh",
        "-c",
        f'echo "{input_data}" | {config["run_cmd"]}',
    ]

    print("🟡 [EXEC LOG] 언어:", language)
    print("🟡 [EXEC LOG] 입력값:\n", input_data)
    print("🟡 [EXEC LOG] 실행될 Docker 명령어:\n", " ".join(docker_cmd))

    # 실행 시간 측정 시작
    start_time = time.time()

    try:
        result = subprocess.run(
            docker_cmd,
            input=input_data,
            capture_output=True,
            text=True,
            timeout=10,  # 10초 제한
        )
        end_time = time.time()
        execution_time = int((end_time - start_time) * 1000)

        stdout = result.stdout
        stderr = result.stderr

    except subprocess.TimeoutExpired:
        end_time = time.time()
        execution_time = int((end_time - start_time) * 1000)
        stdout = ""
        stderr = "Execution timed out."

    memory_used = len(code.encode("utf-8"))

    # 임시 파일 삭제
    try:
        os.remove(file_path)
        os.rmdir(temp_path)
    except Exception:
        pass

    # 실행 결과 반환
    return {
        "stdout": stdout,
        "stderr": stderr,
        "execution_time": execution_time,
        "memory_used": memory_used,
    }


# ✅ 테스트케이스별 코드 실행 및 비교
async def run_code_against_testcases(code: str, language: str, testcases: list):
    results = []

    for case in testcases:
        if isinstance(case, dict):
            input_data = case.get("example_input") or case.get("input") or ""
            expected_output = (
                case.get("example_output") or case.get("expected_output") or ""
            )
        else:
            input_data = case.example_input or ""
            expected_output = case.example_output or ""

        result = await execute_code(code, language, input_data)

        passed = result["stdout"].strip() == expected_output.strip()

        results.append(
            {
                "input": input_data,
                "expected_output": expected_output,
                "actual_output": result["stdout"].strip(),
                "passed": passed,
                "stderr": result["stderr"],
                "execution_time": result["execution_time"],
                "memory_used": result["memory_used"],
            }
        )

    return results
