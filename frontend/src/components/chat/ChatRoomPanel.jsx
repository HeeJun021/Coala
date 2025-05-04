import React, { useState } from "react";
import { FaArrowLeft, FaSearch, FaBars, FaPlus } from "react-icons/fa";
import ChatRoomInfoPanel from "./ChatRoomInfoPanel"; // ✅ 새로 추가한 컴포넌트 import

const ChatRoomPanel = ({ room, onBack }) => {
  const [input, setInput] = useState("");
  const [showInfo, setShowInfo] = useState(false); // ✅ 상태 추가

  const messages = [
    { id: 1, sender: "사용자 1", content: "그거 어렵더라", isMine: false },
    { id: 2, sender: "사용자 1", content: "ㄹㅇ 미치겠어", isMine: false },
    { id: 3, sender: "사용자 1", content: "오늘 시험 문제에서 최소 5개는 틀린듯", isMine: false },
    { id: 4, sender: "사용자 2", content: "너는 잘 봤어?", isMine: false },
    { id: 5, sender: "나", content: "아니 나도 완전 말아먹었어", isMine: true },
    { id: 6, sender: "나", content: "특히 서술형 문제가 제일 어렵더라;; 하나도 못 씀", isMine: true },
  ];

  // 예시 참가자 목록
  const participants = [
    { name: "내이름", isMe: true },
    { name: "사용자 1" },
    { name: "사용자 2" },
    { name: "사용자 3" },
  ];

  if (showInfo) {
    return (
      <ChatRoomInfoPanel
        room={room}
        participants={participants}
        onBack={() => setShowInfo(false)} // ✅ 닫기 핸들러
      />
    );
  }

  return (
    <div className="fixed bottom-24 right-6 w-[360px] h-[520px] bg-slate-200 shadow-lg rounded-xl border border-gray-200 z-50 flex flex-col overflow-hidden">
      {/* 상단바 */}
      <div className="px-4 py-2 border-b border-gray-300 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-gray-600 hover:text-black">
            <FaArrowLeft />
          </button>
          <span className="text-base font-semibold text-gray-800">
            {room?.name || "채팅방"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-gray-600">
          <FaSearch className="cursor-pointer hover:text-black" />
          <FaBars
            className="cursor-pointer hover:text-black"
            onClick={() => setShowInfo(true)} // ✅ 햄버거 클릭 시 열기
          />
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}
          >
            {!msg.isMine && (
              <div className="mr-2 mt-auto w-7 h-7 rounded-full bg-purple-200 flex items-center justify-center text-sm">
                👤
              </div>
            )}
            <div
              className={`px-3 py-1.5 rounded-xl text-sm whitespace-pre-line max-w-[70%] shadow
                ${msg.isMine ? "bg-yellow-200 text-right" : "bg-white"}`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* 입력창 */}
      <div className="px-3 py-2 border-t border-gray-300 bg-white flex items-center gap-2">
        <FaPlus className="text-gray-400" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-4 py-1.5 rounded-full bg-gray-100 text-sm focus:outline-none"
          placeholder="메시지 입력"
        />
      </div>
    </div>
  );
};

export default ChatRoomPanel;
