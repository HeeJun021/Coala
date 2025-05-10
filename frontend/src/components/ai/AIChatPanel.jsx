import React, { useEffect, useState, useRef } from "react";
import GptSessionItem from "./GptSessionItem";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { prism } from "react-syntax-highlighter/dist/esm/styles/prism"; // 🌈 밝은 Prism 스타일
import "react-resizable/css/styles.css"; // 필수!
import { ResizableBox } from "react-resizable"; // 상단에 추가했을 것

import {
  createGptSession,
  fetchGptSessions,
  fetchGptSessionDetail,
  sendGptMessage,
  updateGptSessionTitle,
  deleteGptSession,
} from "../../api/gptApi";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
dayjs.extend(isToday);
dayjs.extend(isYesterday);

const AIChatPanel = ({ onClose }) => {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const [copiedStates, setCopiedStates] = useState({});
  const handleCopy = (index, code) => {
    navigator.clipboard.writeText(code);
    setCopiedStates((prev) => ({ ...prev, [index]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [index]: false }));
    }, 3000);
  };

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]);

  const loadSessions = async () => {
    const data = await fetchGptSessions();
    setSessions(data);
  };

  const loadSessionMessages = async (sessionId) => {
    const data = await fetchGptSessionDetail(sessionId);
    setActiveSessionId(sessionId);
    setMessages(data.messages);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    setLoading(true);
    try {
      if (!activeSessionId) {
        const newSession = await createGptSession({
          context: window.location.pathname,
          message: input,
        });
        await loadSessions();
        await loadSessionMessages(newSession.session_id);
        setMessages((prev) => [
          ...prev,
          { sender_type: "user", content: input },
          { sender_type: "assistant", content: newSession.response },
        ]);
      } else {
        const res = await sendGptMessage(activeSessionId, input);
        setMessages((prev) => [
          ...prev,
          { sender_type: "user", content: input },
          { sender_type: "assistant", content: res.response },
        ]);
      }
      setInput("");
    } catch (err) {
      alert("GPT 응답 실패");
    } finally {
      setLoading(false);
    }
  };

  const groupSessionsByDate = (sessions) => {
    const groups = {};
    sessions.forEach((s) => {
      const date = dayjs(s.updated_at);
      let label = date.format("YYYY-MM-DD");
      if (date.isToday()) label = "오늘";
      else if (date.isYesterday()) label = "어제";
      if (!groups[label]) groups[label] = [];
      groups[label].push(s);
    });
    return groups;
  };

  const grouped = groupSessionsByDate(sessions);

  // ✅ 코드 블록 렌더링 함수 (스타일 적용 포함)
  const renderMessageContent = (content) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const [fullMatch, lang = "plaintext", code] = match;
      const index = match.index;

      if (index > lastIndex) {
        parts.push(
          <p key={index} className="mb-1 whitespace-pre-wrap">
            {content.slice(lastIndex, index)}
          </p>
        );
      }

      parts.push(
        <div key={index + "-wrapper"} className="relative group mb-3">
          {/* ✅ 상단 툴바 영역 */}
          <div className="absolute top-0 left-0 w-full flex justify-between px-2 py-1 z-10">
            <button
              onClick={() => handleCopy(index, code)}
              className="text-xs bg-[#edf2f7] text-gray-800 px-3 py-1 rounded hover:bg-[#e2e8f0] shadow-sm transition"
              style={{ cursor: "pointer" }}
            >
              {copiedStates[index] ? "✅ 복사됨" : "📋 복사"}
            </button>
          </div>

          {/* ✅ 코드 박스 */}
          <SyntaxHighlighter
            language={lang}
            style={prism}
            customStyle={{
              backgroundColor: "#f6f8fa",
              borderRadius: "8px",
              paddingTop: "2.2rem", // 공간 확보 (버튼 영역 피하기 위함)
              paddingRight: "12px",
              paddingBottom: "12px",
              paddingLeft: "12px",
              fontSize: "0.85rem",
              overflowX: "auto",
              fontFamily: "'JetBrains Mono', monospace",
            }}
            codeTagProps={{
              style: {
                fontFamily: "'JetBrains Mono', monospace",
              },
            }}
            className="prism-style-on-white"
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );

      lastIndex = index + fullMatch.length;
    }

    if (lastIndex < content.length) {
      parts.push(
        <p key="last" className="whitespace-pre-wrap">
          {content.slice(lastIndex)}
        </p>
      );
    }

    return parts;
  };

  return (
    <ResizableBox
      width={700}
      height={500}
      minConstraints={[500, 300]}
      maxConstraints={[1000, 800]}
      resizeHandles={["nw"]}
      style={{
        position: "fixed",
        right: "1.5rem", // = right-6
        bottom: "6rem", // = bottom-24
        zIndex: 50,
      }}
      className="bg-white shadow-2xl rounded-xl overflow-hidden"
    >
      <div className="w-full h-full flex">
        {/* 좌측: 세션 목록 */}
        <div className="w-[30%] border-r overflow-y-auto px-2 pt-4">
          <div className="font-semibold text-lg mb-3 px-2">📜 대화 목록</div>
          {Object.entries(grouped).map(([label, sessionList]) => (
            <div key={label} className="mb-3">
              <div className="text-xs font-semibold text-gray-500 mb-1 px-2">
                {label}
              </div>
              {sessionList.map((s) => (
                <GptSessionItem
                  key={s.session_id}
                  session={s}
                  isActive={s.session_id === activeSessionId}
                  onSelect={() => loadSessionMessages(s.session_id)}
                  onRename={(newTitle) =>
                    updateGptSessionTitle(s.session_id, newTitle).then(
                      loadSessions
                    )
                  }
                  onDelete={() =>
                    deleteGptSession(s.session_id).then(() => {
                      if (activeSessionId === s.session_id) {
                        setActiveSessionId(null);
                        setMessages([]);
                      }
                      loadSessions();
                    })
                  }
                />
              ))}
            </div>
          ))}
        </div>

        {/* 우측: 채팅 영역 */}
        <div className="w-[70%] flex flex-col p-4">
          <div className="font-semibold text-lg mb-2">🤖 코딩 챗봇</div>
          <div className="flex-1 overflow-y-auto border rounded p-2 mb-2 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-2 ${
                  msg.sender_type === "user" ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`inline-block px-3 py-2 rounded-lg text-sm leading-relaxed ${
                    msg.sender_type === "user"
                      ? "bg-blue-100 ml-auto max-w-[100%]"
                      : "bg-gray-200 text-black max-w-[100%]"
                  }`}
                >
                  {renderMessageContent(msg.content)}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded p-2"
              placeholder="질문을 입력하세요..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? "전송 중..." : "전송"}
            </button>
          </div>
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
        >
          ✖
        </button>
      </div>
    </ResizableBox>
  );
};

export default AIChatPanel;
