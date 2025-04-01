import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { dracula } from "@uiw/codemirror-theme-dracula";

const CodeTestTerminalPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const codeLanguage = queryParams.get("language") || "";
  const title = queryParams.get("title") || "코딩 테스트 연습";
  const problemDescription = queryParams.get("problem_description") || "코드를 실행하여 결과를 확인하세요.";
  const initialCode = queryParams.get("code") || "";

  const terminalRef = useRef(null);
  const termInstance = useRef(null);
  const socketRef = useRef(null);

  const [code, setCode] = useState(decodeURIComponent(initialCode));

  useEffect(() => {
    let term;
    let socket;
  
    const initTerminal = () => {
      if (!terminalRef.current) return;
  
      term = new Terminal({
        cols: 80,
        rows: 15,
        cursorBlink: true,
        fontSize: 14,
      });
      term.open(terminalRef.current);
      termInstance.current = term;

      const wsUrl = `ws://localhost:8000/ws/terminal`;
      socket = new WebSocket(wsUrl);
      socketRef.current = socket;
  
      socket.onopen = () => {
        term.writeln(`📄 ${decodeURIComponent(title)}`);
        term.writeln("✅ 서버와 연결되었습니다. 실행 버튼을 눌러보세요.\n");
      };
  
      socket.onmessage = (event) => {
        term.writeln(event.data);
      };
  
      socket.onclose = () => {
        term.writeln("❗️ 서버 연결이 종료되었습니다. 페이지를 새로고침하세요.");
      };
  
      socket.onerror = (err) => {
        term.writeln("❗️ 서버 연결 오류 발생.");
        console.error(err);
      };
    };
  
    initTerminal();
  
    return () => {
      socket?.close();
      term?.dispose();
    };
  }, [title, problemDescription]);
  
  const handleRun = () => {
    if (socketRef.current && socketRef.current.readyState === 1) {
      socketRef.current.send(
        JSON.stringify({
          language: codeLanguage,
          code: code,
        })
      );
    } else {
      termInstance.current.writeln("❗️ 서버 연결이 끊어졌습니다. 새로고침 해주세요.");
    }
  };
  

  return (
    <div className="min-h-screen flex flex-col items-center p-8 bg-gray-100 text-black">
      <div className="w-full max-w-5xl bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">{decodeURIComponent(title)}</h1>

        <div className="p-4 border rounded-md bg-gray-100 text-gray-800 mb-4">
          <h2 className="text-lg font-semibold">문제 설명</h2>
          <p
            className="text-base leading-7"
            dangerouslySetInnerHTML={{ __html: decodeURIComponent(problemDescription) }}
          ></p>
        </div>

        <div className="border rounded-md p-4 bg-gray-100 text-gray-800 mb-4">
          <h2 className="text-lg font-semibold">코드 입력</h2>
          <CodeMirror
            value={code}
            height="200px"
            theme={dracula}
            extensions={codeLanguage === "javascript" ? [javascript()] : [python()]}
            onChange={(value) => setCode(value)}
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
              setCode(decodeURIComponent(initialCode));
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
