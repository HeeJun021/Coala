import React, { useEffect, useState, useRef } from "react";
import GptSessionItem from "./GptSessionItem";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { prism } from "react-syntax-highlighter/dist/esm/styles/prism"; 
import "react-resizable/css/styles.css"; 
import { ResizableBox } from "react-resizable";
import {
  ScrollText,
  Bot,
  X,
  Copy,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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

  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [hoveringEdge, setHoveringEdge] = useState(false);

  const [streamingMessage, setStreamingMessage] = useState("");

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
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingMessage]); //streamingMessage 추가

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

    const userMessage = { sender_type: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setStreamingMessage("");

    try {
      const response = activeSessionId
        ? await sendGptMessage(activeSessionId, input)
        : await createGptSession({
            context: window.location.pathname,
            message: input,
          });

      // 세션 새로 만들었을 경우 → 세션 ID 세팅
      if (!activeSessionId) {
        await loadSessions();
        setActiveSessionId(response.session_id);
      }

      const content = response.response;
      let i = 0;
      const interval = setInterval(() => {
        setStreamingMessage((prev) => {
          const next = prev + content[i];
          i++;
          if (i >= content.length) {
            clearInterval(interval);
            setMessages((prev) => [
              ...prev,
              { sender_type: "assistant", content },
            ]);
            setStreamingMessage("");
            setLoading(false);
          }
          return next;
        });
      }, 20);
    } catch (err) {
      alert("GPT 응답 실패");
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

  const renderInlineCode = (text) => {
    const inlineCodeRegex = /`([^`]+)`/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = inlineCodeRegex.exec(text)) !== null) {
      const index = match.index;

      // 일반 텍스트 추가
      if (index > lastIndex) {
        parts.push(text.slice(lastIndex, index));
      }

      // 인라인 코드 span으로 감싸기
      parts.push(
        <span
          key={index}
          className="bg-gray-100 text-pink-700 font-mono px-1 rounded text-[0.9rem]"
        >
          {match[1]}
        </span>
      );

      lastIndex = index + match[0].length;
    }

    // 마지막 텍스트
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  // 코드 블록 렌더링 함수 (스타일 적용 포함)
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
          <p key={index} className="mb-1 whitespace-pre-wrap leading-relaxed">
            {renderInlineCode(content.slice(lastIndex, index))}
          </p>
        );
      }

      parts.push(
        <div key={index + "-wrapper"} className="relative group mb-3">
          {/* 상단 툴바 영역 */}
          <div className="absolute top-0 left-0 w-full flex justify-between px-2 py-1 z-10">
            <button
              onClick={() => handleCopy(index, code)}
              className="text-xs bg-[#edf2f7] text-gray-800 px-3 py-1 rounded hover:bg-[#e2e8f0] shadow-sm transition"
              style={{ cursor: "pointer" }}
            >
              {copiedStates[index] ? (
                <span className="flex items-center gap-1 text-gray-700">
                  <Check className="w-4 h-4" />
                  복사됨
                </span>
              ) : (
                <span className="flex items-center gap-1 text-gray-700">
                  <Copy className="w-4 h-4" />
                  복사
                </span>
              )}
            </button>
          </div>

          {/* 코드 박스 */}
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
        <p key="last" className="whitespace-pre-wrap leading-relaxed">
          {renderInlineCode(content.slice(lastIndex))}
        </p>
      );
    }

    return parts;
  };

  return (
    // 🔁 전체를 감싸는 고정된 wrapper
    <div
      style={{
        position: "fixed",
        right: "1.5rem",
        bottom: "6rem",
        zIndex: 50,
      }}
      className="bg-white shadow-2xl rounded-xl overflow-hidden flex"
    >
      {/* 3단계: 펼치기 버튼은 이곳에 위치 */}
      {/* 열기 버튼 (좌측 고정 위치) */}
      {!sidebarVisible && (
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-40">
          <button
            onMouseEnter={() => setHoveringEdge(true)}
            onMouseLeave={() => setHoveringEdge(false)}
            onClick={() => setSidebarVisible(true)}
            className={`transition-opacity duration-200 bg-white border px-1.5 py-1 rounded-r shadow ${
              hoveringEdge ? "opacity-100" : "opacity-0"
            }`}
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      )}

      {/* 좌측: 세션 목록 (고정 크기) */}
      {sidebarVisible && (
        <div className="w-[200px] border-r overflow-y-auto px-2 pt-4 relative">
          {/* 숨기기 버튼 */}
          <button
            onClick={() => setSidebarVisible(false)}
            className="absolute top-2 right-2 text-gray-500 hover:text-black z-10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="font-semibold text-lg mb-3 px-2 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-indigo-600" />
            대화 목록
          </div>

          {Object.entries(grouped).map(([label, sessionList]) => (
            <div key={label} className="mb-1">
              <div className="text-xs font-semibold text-gray-500 mb-1 px-2">
                {label}
              </div>
              <div className="flex flex-col space-y-[2px]">
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
            </div>
          ))}
        </div>
      )}

      {/* 우측: 코딩 챗봇 영역만 리사이즈 */}
      <ResizableBox
        width={450}
        height={500}
        minConstraints={[350, 300]}
        maxConstraints={[900, 800]}
        resizeHandles={["nw"]}
        className="bg-white"
      >
        <div className="w-full h-full flex flex-col p-4 relative">
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-black z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="font-semibold text-lg mb-2 flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            코딩 챗봇
          </div>

          <div className="flex-1 overflow-y-auto border rounded p-2 mb-2 bg-gray-50">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-black text-sm text-center px-4">
                안녕하세요! 👋
                <br />
                챗봇에게 무엇이든 물어봐주세요!
              </div>
            ) : (
              <>
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
                {streamingMessage && (
                  <div className="mb-2 text-left">
                    <div
                      className="inline-block px-3 py-2 rounded-lg text-sm leading-relaxed bg-gray-200 text-black max-w-[100%]"
                      style={{ animation: "fadeIn 0.15s ease-in-out" }}
                    >
                      {renderMessageContent(streamingMessage)}
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </>
            )}
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
              className={`px-4 py-2 rounded flex items-center justify-center gap-2 text-white ${
                loading
                  ? "bg-green-600 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                "전송"
              )}
            </button>
          </div>
        </div>
      </ResizableBox>
    </div>
  );
};

export default AIChatPanel;
