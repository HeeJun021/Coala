import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { python } from "@codemirror/lang-python";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { createTheme } from "@uiw/codemirror-themes";
import apiClient from "../api/apiClient";

const CodeTestPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCode = queryParams.get("code") || "";
  const codeLanguage = queryParams.get("language") || "";
  const title = queryParams.get("title") || "코딩 테스트 연습";
  const problemDescription = queryParams.get("problem_description") || "코드를 실행하여 결과를 확인하세요.";
  const [code, setCode] = useState(decodeURIComponent(initialCode));
  const [result, setResult] = useState("");
  const [htmlPreview, setHtmlPreview] = useState("");
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState(codeLanguage.toLowerCase() || "javascript");

  const oneLight = createTheme({
    theme: "light",
    settings: {
      background: "#ffffff",
      foreground: "#000000",
      selection: "#d6d6d6",
      cursor: "#000000",
    },
  });

  const runCode = async () => {
    try {
      if (language.toLowerCase() !== codeLanguage.toLowerCase()) {
        setResult(`🚨 선택한 언어(${language})와 코드의 언어(${codeLanguage})가 일치하지 않습니다. 언어를 ${codeLanguage}로 바꿔주세요.`);
        setHtmlPreview("");
        return;
      }

      const response = await apiClient.post("/api/run-code", {
        language: language,
        code: code,
      });

      setResult(response.data.output || "✅ 실행 완료");
      setHtmlPreview(response.data.html_output || ""); // 백엔드에서 HTML 출력 제공
    } catch (error) {
      setResult(`🚨 오류 발생: ${error.response?.data?.detail || error.message}`);
      setHtmlPreview("");
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center p-8 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <div className="w-full max-w-5xl bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">{decodeURIComponent(title)}</h1>

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
            className="border px-4 py-2 rounded"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="javascript">JavaScript</option>
            <option value="html">HTML</option>
            <option value="python">Python</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-md bg-gray-100 text-gray-800">
            <h2 className="text-lg font-semibold">문제 설명</h2>
            <p>{decodeURIComponent(problemDescription)}</p>
          </div>

          <div className="border rounded-md p-4 bg-gray-100 text-gray-800">
            <h2 className="text-lg font-semibold">코드 입력</h2>
            <CodeMirror
              value={code}
              extensions={[
                language === "javascript" ? javascript() :
                language === "html" ? html() :
                python()
              ]}
              onChange={(value) => setCode(value)}
              theme={theme === "dark" ? dracula : oneLight}
              className="mt-2 border rounded"
            />
          </div>
        </div>

        <div className="mt-4 p-4 border rounded-md bg-gray-100 text-gray-800">
  <h2 className="text-lg font-semibold">실행 결과</h2>
  <div className="border rounded p-2 min-h-[50px]">{result}</div>
  {htmlPreview && (
    <div className="mt-4 p-2 border rounded bg-white">
      <div dangerouslySetInnerHTML={{ __html: htmlPreview }} />
    </div>
  )}
</div>


        <div className="flex justify-end mt-4">
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded mr-2"
            onClick={() => {
              setCode(decodeURIComponent(initialCode));
              setResult("");
              setHtmlPreview("");
            }}
          >
            초기화
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={runCode}
          >
            코드 실행
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeTestPage;