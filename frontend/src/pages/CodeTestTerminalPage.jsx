import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { python } from "@codemirror/lang-python";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { createTheme } from "@uiw/codemirror-themes";

const CodeTestTerminalPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const codeLanguage = queryParams.get("language") || "";
  const title = queryParams.get("title") || "코딩 테스트 연습";
  const problemDescription = queryParams.get("problem_description") || "코드를 실행하여 결과를 확인하세요.";
  const initialCode = queryParams.get("code") || "";

  const safeDecodeURIComponent = (str) => {
    try {
      return decodeURIComponent(str);
    } catch (e) {
      console.error("디코딩 오류:", e);
      return str;
    }
  };

  const [theme, setTheme] = useState("light");
  const terminalRef = useRef(null);
  const socketRef = useRef(null);
  const [code, setCode] = useState(safeDecodeURIComponent(initialCode));
  const [inputValue, setInputValue] = useState(""); // ✅ 입력값 상태 추가

  useEffect(() => {
    const term = new Terminal({
      cols: 80,
      rows: 15,
      cursorBlink: true,
      fontSize: 14,
    });

    requestAnimationFrame(() => {
      if (terminalRef.current) {
        term.open(terminalRef.current);
      }
    });

    const socket = new WebSocket("ws://localhost:8000/ws/terminal");
    socketRef.current = socket;

    socket.onopen = () => {
      term.writeln(`📄 ${title}`);
      term.writeln("✅ 서버와 연결되었습니다.");
      term.writeln("🔽 코드 실행 버튼을 누르면 결과가 표시됩니다.\n");
    };

    socket.onmessage = (event) => {
      term.writeln(event.data);
    };

    socket.onclose = () => {
      term.writeln("❗️ 서버 연결이 종료되었습니다.");
    };

    return () => {
      socket.close();
      term.dispose();
    };
  }, [codeLanguage, title]);

  const handleRun = () => {
    if (socketRef.current && socketRef.current.readyState === 1) {
      socketRef.current.send(
        JSON.stringify({
          language: codeLanguage,
          code: code,
          input: inputValue, // ✅ 입력값 추가
        })
      );
    }
  };

  const oneLight = createTheme({
    theme: "light",
    settings: {
      background: "#ffffff",
      foreground: "#000000",
      selection: "#d6d6d6",
      cursor: "#000000",
    },
  });

  return (
    <div className={`min-h-screen flex flex-col items-center p-8 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <div className="w-full max-w-5xl bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">{safeDecodeURIComponent(title)}</h1>

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
        </div>

        <div className="p-4 border rounded-md bg-gray-100 text-gray-800 mb-4">
          <h2 className="text-lg font-semibold">문제 설명</h2>
          <p className="text-base leading-7">
            {safeDecodeURIComponent(problemDescription)}
          </p>
        </div>

        <div className="border rounded-md p-4 bg-gray-100 text-gray-800 mb-4">
          <h2 className="text-lg font-semibold">코드 입력</h2>
          <CodeMirror
            value={code}
            extensions={[
              codeLanguage.toLowerCase() === "javascript"
                ? javascript()
                : codeLanguage.toLowerCase() === "html"
                ? html()
                : codeLanguage.toLowerCase() === "css"
                ? css()
                : python(),
            ]}
            onChange={(value) => setCode(value)}
            theme={theme === "dark" ? dracula : oneLight}
            className="mt-2 border rounded"
          />
        </div>

        {/* ✅ 입력창 추가 */}
        <div className="border rounded-md p-4 bg-gray-100 text-gray-800 mb-4">
          <h2 className="text-lg font-semibold mb-2">입력값 (Optional)</h2>
          <textarea
            className="w-full h-24 p-2 border rounded-md"
            placeholder="입력값을 작성하세요"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </div>

        <div className="mt-4 p-4 border rounded-md bg-gray-100 text-gray-800" style={{ minHeight: "300px" }}>
          <h2 className="text-lg font-semibold mb-2">실행 결과 (Terminal)</h2>
          <div
            ref={terminalRef}
            className="w-full border rounded bg-black text-green-400 p-2"
            style={{ height: "240px" }}
          />
        </div>

        <div className="flex justify-end mt-4">
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded mr-2"
            onClick={() => {
              setCode(safeDecodeURIComponent(initialCode));
              setInputValue("");
            }}
          >
            초기화
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={handleRun}
          >
            코드 실행
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeTestTerminalPage;
