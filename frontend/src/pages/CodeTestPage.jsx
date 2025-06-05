import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Controlled as CodeMirror } from "react-codemirror2";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/eclipse.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/htmlmixed/htmlmixed";
import "codemirror/mode/css/css";
import "codemirror/mode/python/python";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, prism } from "react-syntax-highlighter/dist/esm/styles/prism";
import apiClient from "../api/apiClient";

const CodeTestPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCode = queryParams.get("code") || "";
  const codeLanguage = queryParams.get("language") || "";
  const title = queryParams.get("title") || "코딩 테스트 연습";
  const problemDescription = queryParams.get("problem_description") || "코드를 실행하여 결과를 확인하세요.";

  const safeDecodeURIComponent = (str) => {
    try {
      return decodeURIComponent(str);
    } catch (e) {
      console.error("디코딩 오류:", e);
      return str;
    }
  };

  const [code, setCode] = useState(safeDecodeURIComponent(initialCode));
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [htmlPreview, setHtmlPreview] = useState("");
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState(safeDecodeURIComponent(codeLanguage).toLowerCase() || "javascript");

  const runCode = async () => {
    try {
      if (language.toLowerCase() !== safeDecodeURIComponent(codeLanguage).toLowerCase()) {
        setResult(`🚨 선택한 언어(${language})와 코드의 언어(${codeLanguage})가 일치하지 않습니다. 언어를 ${codeLanguage}로 바꿔주세요.`);
        setError("");
        setHtmlPreview("");
        return;
      }

      if (language === "javascript" && (code.includes("<script>") || code.includes("</script>"))) {
        setResult("");
        setError("🚨 JavaScript 실행에서는 <script> 태그를 포함할 수 없습니다.");
        setHtmlPreview("");
        return;
      }

      const response = await apiClient.post("/api/run-code", {
        language,
        code,
        input,
      });

      setResult(response.data.output || "✅ 실행 완료");
      setError(response.data.error || "");
      setHtmlPreview(response.data.html_output || "");
    } catch (error) {
      setResult("");
      setError(`🚨 오류 발생: ${error.response?.data?.detail || error.message}`);
      setHtmlPreview("");
    }
  };

  const getCodeMirrorMode = () => {
    if (language === "html") return "htmlmixed";
    if (language === "css") return "css";
    if (language === "python") return "python";
    return "javascript";
  };

  const withWhiteBackground = htmlPreview?.includes("<body")
    ? htmlPreview.replace(/<body([^>]*)>/, `<body$1 style="background-color: white;">`)
    : `<body style="background-color: white;">${htmlPreview}</body>`;

  return (
    <div className={`min-h-screen flex flex-col items-center p-8 transition-all duration-300
      ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <div className={`w-full max-w-5xl shadow-lg rounded-xl p-8 transition-all duration-300
        ${theme === "dark" ? "bg-[#1e1e1e] text-white" : "bg-white text-black"}`}>

        <h1 className="text-3xl font-bold mb-4 text-center">{safeDecodeURIComponent(title)}</h1>

        <div className="flex justify-between mb-4">
          <div>
            <button
              className={`px-4 py-2 rounded-l ${theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-300 text-black"}`}
              onClick={() => setTheme("dark")}
            >
              Dark
            </button>
            <button
              className={`px-4 py-2 rounded-r ${theme === "light" ? "bg-gray-700 text-white" : "bg-gray-300 text-black"}`}
              onClick={() => setTheme("light")}
            >
              Light
            </button>
          </div>
          <select
            className={`border px-4 py-2 rounded transition-all duration-200
              ${theme === "dark" ? "bg-[#2d2d2d] text-white border-gray-500" : "bg-white text-black border-gray-300"}`}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="javascript">JavaScript</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="python">Python</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 border rounded-md ${theme === "dark" ? "bg-[#2d2d2d]" : "bg-gray-100"}`}>
            <h2 className="text-lg font-semibold">문제 설명</h2>
            <div className="text-base leading-7" dangerouslySetInnerHTML={{ __html: safeDecodeURIComponent(problemDescription) }} />
            {(language === "javascript" || language === "python") && (
              <div className="mt-4">
                <h2 className="text-lg font-semibold">입력값</h2>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="입력값을 작성하세요"
                  className="w-full p-2 border rounded mt-2"
                  rows={4}
                />
              </div>
            )}
          </div>

          <div className={`border rounded-md p-4 ${theme === "dark" ? "bg-[#2d2d2d]" : "bg-gray-100"}`}>
            <h2 className="text-lg font-semibold">코드 입력</h2>
            <CodeMirror
              value={code}
              options={{
                mode: getCodeMirrorMode(),
                theme: theme === "dark" ? "dracula" : "eclipse",
                lineNumbers: true,
                lineWrapping: true,
                tabSize: 4,
              }}
              onBeforeChange={(editor, data, value) => setCode(value)}
              className="mt-2 border rounded"
            />
          </div>
        </div>

        <div className={`mt-4 p-4 border rounded-md ${theme === "dark" ? "bg-[#2d2d2d]" : "bg-gray-100"}`}>
          <h2 className="text-lg font-semibold">실행 결과</h2>
          <div className={`border rounded p-2 min-h-[50px] font-mono text-sm ${theme === "dark" ? "bg-[#1e1e1e] text-green-300" : "bg-white text-black"}`}>
            {htmlPreview && (
              <div className="mt-2">
                <iframe
                  srcDoc={withWhiteBackground}
                  title="HTML/CSS Preview"
                  className="w-full h-64 border rounded"
                  sandbox="allow-same-origin allow-scripts"
                />
              </div>
            )}
            {(result || error) && !htmlPreview && (
              <div className="mt-2">
                {result && (
                  <SyntaxHighlighter
                    language="plaintext"
                    style={theme === "dark" ? vscDarkPlus : prism}
                    customStyle={{ background: "transparent", padding: 0, margin: 0 }}
                  >
                    {result}
                  </SyntaxHighlighter>
                )}
                {error && (
                  <SyntaxHighlighter
                    language="plaintext"
                    style={theme === "dark" ? vscDarkPlus : prism}
                    customStyle={{ background: "transparent", padding: 0, margin: 0, color: "#f44747" }}
                  >
                    {error}
                  </SyntaxHighlighter>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded mr-2"
            onClick={() => {
              setCode(safeDecodeURIComponent(initialCode));
              setInput("");
              setResult("");
              setError("");
              setHtmlPreview("");
            }}
          >
            초기화
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={runCode}>
            코드 실행
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeTestPage;
