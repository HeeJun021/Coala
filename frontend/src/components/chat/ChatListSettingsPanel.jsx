import React, { useState } from "react";
import { FaCheck } from "react-icons/fa";

const COLORS = [
  "#B0C4DE", "#6A79BB", "#A8D5C0", "#4DA5A6", "#9FB64D",
  "#F7D154", "#F79C5D", "#F47B7B", "#F7A7CD", "#5C4B4B",
  "#E0E0DC", "#595959", "#4B4A77", "#0B3B52", "#8B94A3",
];

const ChatListSettingsPanel = ({ user, onClose }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationSound, setNotificationSound] = useState("기본음");
  const [bgColor, setBgColor] = useState(COLORS[0]);
  const [tempColor, setTempColor] = useState(bgColor);
  const [pinnedChats, setPinnedChats] = useState(["채팅방 A", "채팅방 B"]);
  const [showColorModal, setShowColorModal] = useState(false);

  const handleUnpin = (chat) => {
    setPinnedChats((prev) => prev.filter((c) => c !== chat));
  };

  const handleApplyColor = () => {
    setBgColor(tempColor);
    setShowColorModal(false);
  };

  return (
    <>
      {/* 설정 패널 */}
      <div className="fixed bottom-24 right-6 w-[360px] h-[520px] bg-white border border-gray-300 rounded-xl shadow-lg flex flex-col z-50">
        {/* 헤더 */}
        <div className="px-4 py-3 border-b text-lg font-semibold">설정</div>

        {/* 프로필 */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-300 rounded-full flex items-center justify-center text-white">
              👤
            </div>
            <span className="text-gray-800 font-medium text-sm">
              {user?.name || "사용자 이름"}
            </span>
          </div>
          <button className="text-xs px-3 py-1 rounded bg-green-200 text-gray-800 hover:bg-green-300">
            프로필 변경
          </button>
        </div>

        {/* 설정 영역 */}
        <div className="flex-1 px-4 py-4 text-sm text-gray-800 space-y-6 overflow-y-auto">
          {/* 알림 설정 */}
          <div>
            <div className="font-semibold mb-2">🔔 알림 설정</div>
            <div className="flex justify-between items-center mb-2">
              <span>메시지 알림</span>
              <input
                type="checkbox"
                className="w-5 h-5 accent-blue-500"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
            </div>
            <div className="flex justify-between items-center">
              <span>알림 소리</span>
              <select
                value={notificationSound}
                onChange={(e) => setNotificationSound(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="기본음">기본음</option>
                <option value="벨소리1">벨소리1</option>
                <option value="벨소리2">벨소리2</option>
              </select>
            </div>
          </div>

          {/* 채팅방 스타일 설정 */}
          <div>
            <div className="font-semibold mb-2">💬 채팅방 스타일</div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400 border border-black" />
                <span>기본 배경</span>
              </div>
              <button
                onClick={() => {
                  setTempColor(bgColor);
                  setShowColorModal(true);
                }}
                className="border text-xs px-3 py-1 rounded hover:bg-gray-100"
              >
                배경화면 설정
              </button>
            </div>
          </div>

          {/* 고정 채팅 관리 */}
          <div>
            <div className="font-semibold mb-2">📌 고정 채팅 관리</div>
            <ul className="list-disc ml-4 text-xs text-gray-600 space-y-1">
              {pinnedChats.map((chat, idx) => (
                <li key={idx}>
                  {chat}
                  <button
                    className="ml-2 text-blue-500 hover:underline"
                    onClick={() => handleUnpin(chat)}
                  >
                    해제
                  </button>
                </li>
              ))}
              {pinnedChats.length === 0 && (
                <li className="text-gray-400">없음</li>
              )}
            </ul>
          </div>

          {/* 보안 / 차단 */}
          <div>
            <div className="font-semibold mb-2">🛡 보안 / 차단</div>
            <button className="text-sm text-blue-500 hover:underline">
              차단 목록 보기
            </button>
          </div>
        </div>

        {/* 닫기 */}
        <div className="border-t px-4 py-2 bg-gray-100">
          <button
            onClick={onClose}
            className="w-full text-sm text-gray-500 hover:text-black"
          >
            닫기
          </button>
        </div>
      </div>

{/* 배경화면 설정 모달 (설정창 내부에 표시) */}
{showColorModal && (
  <div className="absolute inset-0 z-50">
    {/* 반투명 배경 (설정창 내부만 덮음) */}
    <div className="absolute inset-0 bg-black/20 z-10 rounded-xl" />

    {/* 모달 본체 */}
    <div className="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-4 w-[250px]">
      <div className="text-sm font-semibold mb-2">배경화면 설정</div>
      <div className="grid grid-cols-5 gap-2 mb-4">
        {COLORS.map((color) => (
          <div
            key={color}
            onClick={() => setTempColor(color)}
            className="w-8 h-8 rounded-full cursor-pointer relative border-2 border-transparent hover:scale-105"
            style={{ backgroundColor: color }}
          >
            {tempColor === color && (
              <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">
                <FaCheck />
              </div>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={handleApplyColor}
        className="w-full py-1 rounded bg-blue-500 text-white text-sm hover:bg-blue-600"
      >
        적용
      </button>
    </div>
  </div>
)}

    </>
  );
};

export default ChatListSettingsPanel;
