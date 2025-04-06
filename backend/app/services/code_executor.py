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
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(code)


    host_path = os.path.abspath(temp_path).replace("\\", "/")

    docker_cmd = [
    "docker", "run", "--rm",
    "-v", f"{host_path}:/app",
    "-w", "/app",
    config["image"],
    "sh", "-c", f'echo "{input_data}" | {config["run_cmd"]}'
]
     # ✅ 로그 출력
    print("🟡 [EXEC LOG] 언어:", language)
    print("🟡 [EXEC LOG] 입력값:\n", input_data)
    print("🟡 [EXEC LOG] 저장된 코드 파일 경로:", file_path)
    print("🟡 [EXEC LOG] 실행될 Docker 명령어:\n", " ".join(docker_cmd))



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
        
        # ✅ 결과 로그
        print("✅ [EXEC RESULT] STDOUT:\n", stdout)
        print("❌ [EXEC RESULT] STDERR:\n", stderr)
        
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


async def run_code_against_testcases(code: str, language: str, testcases: list):
    results = []

    for case in testcases:
        # 🔍 안전하게 출력
        print("DEBUG:", case)

        # case가 dict라면
        if isinstance(case, dict):
            input_data = case.get("example_input") or case.get("input")
            expected_output = case.get("example_output") or case.get("expected_output")
        else:
            # ORM 객체일 경우
            input_data = case.example_input
            expected_output = case.example_output

        result = await execute_code(code, language, input_data)

        passed = result["stdout"].strip() == expected_output.strip()

        results.append({
            "input": input_data,
            "expected_output": expected_output,
            "actual_output": result["stdout"].strip(),
            "passed": passed,
            "stderr": result["stderr"]
        })

    return results
