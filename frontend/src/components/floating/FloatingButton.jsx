import React, { useState, useRef, useEffect } from "react";
import koalaIcon from "../../assets/floating/floating-coala.png";
import chatIcon from "../../assets/floating/chat-icon.png";
import alertIcon from "../../assets/floating/alert-icon.png";
import aiIcon from "../../assets/floating/ai-icon.png";
import ChatPanelWrapper from "../chat/ChatPanelWrapper";
import AIChatPanel from "../ai/AIChatPanel";

const FloatingButton = () => {
  const [expanded, setExpanded] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const [showAIChat, setShowAIChat] = useState(false);

  const wrapperRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div
        ref={wrapperRef}
        className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3"
      >
        {/* 확장 버튼들 */}
        <div className="flex flex-col items-center gap-3 mb-2">
          {/* ✅ 알림 버튼 (순서 바뀜 - 맨 위로 이동) */}
          <button
            className={`w-12 h-12 rounded-full bg-sky-300 shadow flex items-center justify-center transition-all duration-300 ease-out ${
              expanded
                ? "opacity-100 translate-y-0 delay-[150ms]"
                : "opacity-0 translate-y-4 pointer-events-none"
            }`}
          >
            <img src={alertIcon} alt="알림" className="w-6 h-6" />
          </button>

          {/* ✅ AI 버튼 (이제 알림 아래로 이동) */}
          <button
            onClick={() => setShowAIChat(true)}
            className={`w-12 h-12 rounded-full bg-purple-300 shadow flex items-center justify-center transition-all duration-300 ease-out ${
              expanded
                ? "opacity-100 translate-y-0 delay-[75ms]"
                : "opacity-0 translate-y-4 pointer-events-none"
            }`}
          >
            <img src={aiIcon} alt="AI" className="w-6 h-6" />
          </button>

          {/* 채팅 버튼 */}
          <button
            onClick={() => setShowChat(true)}
            className={`w-12 h-12 rounded-full bg-green-300 shadow flex items-center justify-center transition-all duration-300 ease-out ${
              expanded
                ? "opacity-100 translate-y-0 delay-[0ms]"
                : "opacity-0 translate-y-4 pointer-events-none"
            }`}
          >
            <img src={chatIcon} alt="채팅" className="w-6 h-6" />
          </button>
        </div>

        {/* 플로팅 메인 버튼 */}
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="w-16 h-16 rounded-full bg-white shadow-lg border border-gray-300 flex items-center justify-center hover:scale-105 transition"
        >
          <img
            src={koalaIcon}
            alt="코알라"
            className="w-10 h-10 object-contain"
          />
        </button>
      </div>

      {/* ✅ 채팅창 패널 */}
      {showChat && <ChatPanelWrapper onClose={() => setShowChat(false)} />}
      {/* ✅ 새로운 GPT 채팅창 */}
      {showAIChat && <AIChatPanel onClose={() => setShowAIChat(false)} />}
    </>
  );
};

export default FloatingButton;
