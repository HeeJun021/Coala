import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";

import { Controlled as CodeMirror } from "react-codemirror2";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/python/python";

const safeDecode = (text) => {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
};

const CodeTestTerminalPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const codeLanguage = queryParams.get("language") || "";
  const title = queryParams.get("title") || "코딩 테스트 연습";
  const problemDescription = queryParams.get("problem_description") || "코드를 실행하여 결과를 확인하세요.";
  const initialCode = queryParams.get("code") || "";
  const category = queryParams.get("category") || "";
  const materialId = queryParams.get("id") || "";
  const exampleId = queryParams.get("exampleId") || "";

  const terminalRef = useRef(null);
  const termInstance = useRef(null);
  const socketRef = useRef(null);

  const decodedTitle = safeDecode(title);
  const decodedDescription = safeDecode(problemDescription);
  const decodedCode = safeDecode(initialCode);

  const [code, setCode] = useState(decodedCode);
  const [isRunning, setIsRunning] = useState(false);

  const sendCode = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === 1) {
      socketRef.current.send(
        JSON.stringify({
          language: codeLanguage,
          code: btoa(unescape(encodeURIComponent(code))),
        })
      );
      termInstance.current.writeln("\n🚀 실행 중...\n");
      setIsRunning(false);
    }
  }, [codeLanguage, code]);

  const connectWebSocket = useCallback(() => {
    const wsUrl = `ws://localhost:8000/ws/terminal`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      termInstance.current.writeln(`📄 ${decodedTitle}`);
      termInstance.current.writeln("서버와 연결되었습니다.");
      if (isRunning) {
        sendCode();
      }
    };

    socket.onmessage = (event) => {
      termInstance.current.writeln(event.data);
    };

    socket.onclose = () => {
      termInstance.current.writeln("❗️ 서버 연결 종료");
    };

    socket.onerror = (err) => {
      termInstance.current.writeln("❗️ 서버 연결 오류");
      console.error(err);
    };
  }, [decodedTitle, isRunning, sendCode]);

  useEffect(() => {
    const term = new Terminal({
      cols: 80,
      rows: 15,
      cursorBlink: true,
      fontSize: 14,
    });
    term.open(terminalRef.current);
    termInstance.current = term;
    connectWebSocket();

    return () => {
      socketRef.current?.close();
      term.dispose();
    };
  }, [connectWebSocket]);

  const handleRun = () => {
    if (code.includes("") || code.includes("")) {
      termInstance.current.writeln("❗️ HTML/DOM 관련 코드는 Node.js 환경에서 실행할 수 없습니다.");
      return;
    }

    if (socketRef.current && socketRef.current.readyState === 1) {
      sendCode();
    } else {
      termInstance.current.writeln("🔄 서버와 재연결 중...");
      setIsRunning(true);
      connectWebSocket();
    }
  };

  const getCodeMirrorMode = () => {
    return codeLanguage === "javascript" ? "javascript" : "python";
  };

  const handleBack = () => {
    const query = materialId
      ? `category=${encodeURIComponent(category)}&id=${encodeURIComponent(materialId)}`
      : `category=${encodeURIComponent(category)}&exampleId=${encodeURIComponent(exampleId)}`;
    navigate(`/StudyMaterialsPage?${query}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-3xl font-bold mb-4 text-center">{decodedTitle}</h1>

        <div className="mb-4">
          <h2 className="text-lg font-semibold">문제 설명</h2>
          <div className="text-base leading-7" dangerouslySetInnerHTML={{ __html: decodedDescription }} />
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-semibold">코드 입력</h2>
          <CodeMirror
            value={code}
            options={{
              mode: getCodeMirrorMode(),
              theme: "dracula",
              lineNumbers: true,
              lineWrapping: true,
              tabSize: 4,
            }}
            onBeforeChange={(editor, data, value) => setCode(value)}
            className="mt-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-semibold">실행 결과 (Terminal)</h2>
          <div ref={terminalRef} className="border rounded p-2 bg-black text-green-300 font-mono text-sm" />
        </div>

        <div className="flex justify-between mt-4">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            onClick={handleBack}
          >
            뒤로 가기
          </button>
          <div>
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded mr-2"
              onClick={() => setCode(decodedCode)}
            >
              초기화
            </button>
            <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              onClick={handleRun}
            >
              코드 실행
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeTestTerminalPage;