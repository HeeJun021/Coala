from fastapi import APIRouter, HTTPException
import subprocess
import cssutils

router = APIRouter()

BASE_HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CSS 테스트</title>
    <style>
        {css_code}
    </style>
</head>
<body>
    <div class="container">
        <h1 id="header">제목</h1>
        <p class="highlight">본문 텍스트입니다.</p>
        <button class="button">버튼</button>
    </div>
</body>
</html>
"""

@router.post("/api/run-code")
async def run_code(data: dict):
    language = data.get("language")
    code = data.get("code")

    if not language or not code:
        raise HTTPException(status_code=400, detail="언어와 코드가 필요합니다.")

    if language.lower() == "html":
        return {
            "output": "HTML 미리보기 준비 완료",
            "html_output": code,
            "error": None
        }

    elif language.lower() == "css":
        try:
            cssutils.log.setLevel('ERROR')
            parser = cssutils.CSSParser()
            parser.parseString(code)
        except Exception as e:
            return {
                "output": "CSS 문법 오류",
                "html_output": "",
                "error": str(e)
            }

        html_output = BASE_HTML_TEMPLATE.format(css_code=code)
        return {
            "output": "CSS 미리보기 준비 완료",
            "html_output": html_output,
            "error": None
        }

    elif language.lower() == "javascript":
        # console.log() 자동 삽입
        if "console.log" not in code:
            code += "\nconsole.log('코드 실행 완료');"
        result = subprocess.run(["node", "-e", code], capture_output=True, text=True)
        return {
            "output": result.stdout,
            "html_output": "",
            "error": result.stderr if result.stderr else None
        }

    elif language.lower() == "python":
        # print() 없는 경우 자동 추가
        if "print(" not in code:
            code += "\nprint('코드 실행 완료')"
        result = subprocess.run(["python", "-c", code], capture_output=True, text=True)
        return {
            "output": result.stdout,
            "html_output": "",
            "error": result.stderr if result.stderr else None
        }

    else:
        raise HTTPException(status_code=400, detail="지원하지 않는 언어입니다.")
