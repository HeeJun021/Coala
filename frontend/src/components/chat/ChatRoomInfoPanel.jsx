import React from "react";
import { FaArrowLeft, FaUserPlus, FaPen } from "react-icons/fa";

const ChatRoomInfoPanel = ({ room, participants, onBack }) => {
  return (
    <div className="fixed bottom-24 right-6 w-[360px] h-[520px] bg-gray-100 shadow-lg rounded-xl border border-gray-200 z-50 flex flex-col overflow-hidden">
      {/* 상단바 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <button onClick={onBack} className="text-gray-600 hover:text-black">
          <FaArrowLeft />
        </button>
        <div className="flex flex-col items-center gap-1">
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-purple-300 flex items-center justify-center text-white text-sm">
                👤
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-sm font-semibold">{room?.name || "채팅방"}</span>
            <FaPen className="text-xs text-gray-500 cursor-pointer" />
          </div>
        </div>
        <div className="w-5" /> {/* 오른쪽 여백 맞춤용 */}
      </div>

      {/* 대화상대 목록 */}
      <div className="flex-1 px-4 py-3 overflow-y-auto">
        <div className="text-sm font-semibold mb-2">대화상대 {participants.length}</div>

        <div className="flex items-center gap-2 py-2">
          <FaUserPlus className="text-gray-500" />
          <span className="text-sm text-gray-700">초대하기</span>
        </div>

        {participants.map((user, index) => (
          <div key={index} className="flex items-center gap-2 py-2">
            <div className="w-7 h-7 rounded-full bg-purple-300 flex items-center justify-center text-white text-sm">
              👤
            </div>
            <div className="text-sm text-gray-800">
              {user.isMe ? (
                <>
                  <span className="mr-1 text-xs bg-gray-300 text-white px-1 rounded">나</span>
                  {user.name}
                </>
              ) : (
                user.name
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 하단: 나가기 */}
      <div className="border-t bg-white p-3">
        <button className="text-sm text-red-500 w-full py-1 hover:bg-red-50 rounded">
          채팅방 나가기
        </button>
      </div>
    </div>
  );
};

export default ChatRoomInfoPanel;
