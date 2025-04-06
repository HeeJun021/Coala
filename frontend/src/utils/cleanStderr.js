// 실행 결과 배열을 받아 stderr를 정리해주는 유틸 함수
export function cleanStderr(stderr) {
    if (!stderr) return "";
  
    const lines = stderr.split("\n");
  
    let mainError = "";
    let codeLine = "";
    let lineNumber = null;
  
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
  
      // ✅ 에러 메시지 (예: SyntaxError, NameError 등)
      if (!mainError && line.match(/(SyntaxError|TypeError|ReferenceError|NameError|Exception)/)) {
        mainError = line;
      }
  
      // ✅ 에러 코드 줄 (위에 실제 코드, 아래에 ^ 표시가 있을 때)
      if (lines[i + 1] && lines[i + 1].includes("^")) {
        codeLine = lines[i].trim(); // 바로 위 줄이 코드
      }
  
      // ✅ 몇 번째 줄인지 추출 (예: "/app/main.py:2")
      const match = line.match(/main\.\w+:(\d+)/);
      if (match) {
        lineNumber = match[1];
      }
    }
  
    let message = "⛔ 오류 메시지:\n";
    if (mainError) {
      message += mainError;
      if (codeLine) {
        message += `\n→ ${lineNumber ?? "?"}번째 줄: ${codeLine}`;
      }
    } else {
      message += stderr.trim();
    }
  
    return message;
  }
  