import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  Bot,
  MessageCircle,
} from "lucide-react";
import koalaIcon from "../../assets/floating/floating-coala.png";
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
        {/* 확장된 버튼 목록 */}
        <div className="flex flex-col items-center gap-3 mb-2">
          {/* 알림 버튼 */}
          <button
            className={`w-12 h-12 rounded-full bg-sky-300 shadow flex items-center justify-center transition-all duration-300 ease-out ${
              expanded
                ? "opacity-100 translate-y-0 delay-[150ms]"
                : "opacity-0 translate-y-4 pointer-events-none"
            }`}
          >
            <Bell size={24} className="text-white" />
          </button>

          {/* AI 버튼 */}
          <button
            onClick={() => setShowAIChat(true)}
            className={`w-12 h-12 rounded-full bg-purple-300 shadow flex items-center justify-center transition-all duration-300 ease-out ${
              expanded
                ? "opacity-100 translate-y-0 delay-[75ms]"
                : "opacity-0 translate-y-4 pointer-events-none"
            }`}
          >
            <Bot size={24} className="text-white" />
          </button>

          {/* 채팅 버튼 */}
          <button
            onClick={() => setShowChat(true)}
            className={`w-12 h-12 rounded-full bg-green-400 shadow flex items-center justify-center transition-all duration-300 ease-out ${
              expanded
                ? "opacity-100 translate-y-0 delay-[0ms]"
                : "opacity-0 translate-y-4 pointer-events-none"
            }`}
          >
            <MessageCircle size={24} className="text-white" />
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

      {/* 채팅 패널 */}
      {showChat && <ChatPanelWrapper onClose={() => setShowChat(false)} />}
      {/* AI 패널 */}
      {showAIChat && <AIChatPanel onClose={() => setShowAIChat(false)} />}
    </>
  );
};

export default FloatingButton;
