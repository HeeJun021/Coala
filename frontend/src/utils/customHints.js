// src/utils/customHints.js

export function registerCustomHints() {
  if (typeof window === "undefined" || !window.CodeMirror) return;

  const CodeMirror = window.CodeMirror;

  // 중복 등록 방지
  if (CodeMirror.hint["python-custom"] && CodeMirror.hint["java-custom"]) return;

  // ✅ Python용 힌트 등록
  CodeMirror.registerHelper("hint", "python-custom", function (cm) {
    const cursor = cm.getCursor();
    const token = cm.getTokenAt(cursor);
    const start = token.start;
    const end = cursor.ch;
    const currentWord = token.string.trim();

    const pythonKeywords = [
      "def", "class", "import", "from", "as", "return", "if", "else", "elif", "for",
      "while", "try", "except", "finally", "with", "lambda", "True", "False", "None",
      "int", "float", "str", "list", "dict", "set", "tuple", "print", "len", "range",
    ];

    const list = pythonKeywords
      .filter((kw) => kw.startsWith(currentWord))
      .map((kw) => ({
        text: kw,
        displayText: kw,
        render: renderHintWithMatch, // ✅ 이 부분 추가!
        className: "CodeMirror-hint-match",
      }));

    return {
      list,
      from: CodeMirror.Pos(cursor.line, start),
      to: CodeMirror.Pos(cursor.line, end),
    };
  });

  // ✅ Java용 힌트 등록
  CodeMirror.registerHelper("hint", "java-custom", function (cm) {
    const cursor = cm.getCursor();
    const token = cm.getTokenAt(cursor);
    const start = token.start;
    const end = cursor.ch;
    const currentWord = token.string.trim();

    const javaKeywords = [
      "public", "private", "protected", "class", "interface", "extends", "implements",
      "void", "int", "String", "boolean", "if", "else", "switch", "case", "for", "while",
      "do", "return", "new", "static", "final", "try", "catch", "throw", "throws", "import",
    ];

    const list = javaKeywords
      .filter((kw) => kw.startsWith(currentWord))
      .map((kw) => ({
        text: kw,
        displayText: kw,
        render: renderHintWithMatch, // ✅ 이 부분 추가!
        className: "CodeMirror-hint-match",
      }));

    return {
      list,
      from: CodeMirror.Pos(cursor.line, start),
      to: CodeMirror.Pos(cursor.line, end),
    };
  });
}

// ✅ 렌더 함수 정의
export function renderHintWithMatch(element, self, data) {
  const text = data.text || data.displayText;
  const input = self.input?.toLowerCase?.() || "";
  const index = text.toLowerCase().indexOf(input);

  console.log("렌더링 중", text); // ✅ 로그 출력용

  element.className = "CodeMirror-hint";
  if (index === -1 || input.length === 0) {
    element.textContent = text;
  } else {
    const before = document.createTextNode(text.slice(0, index));
    const match = document.createElement("span");
    match.textContent = text.slice(index, index + input.length);
    match.className = "CodeMirror-hint-match";
    const after = document.createTextNode(text.slice(index + input.length));
    element.appendChild(before);
    element.appendChild(match);
    element.appendChild(after);
  }
}
