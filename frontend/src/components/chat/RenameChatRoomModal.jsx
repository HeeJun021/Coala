import React, { useState } from "react";

const RenameChatRoomModal = ({ currentName, onConfirm, onCancel }) => {
  const [name, setName] = useState(currentName || "");

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30">
      <div className="bg-white w-[300px] rounded-lg shadow-lg p-5">
        <div className="text-base font-semibold mb-2">채팅방 이름</div>
        <input
          type="text"
          value={name}
          maxLength={50}
          onChange={(e) => setName(e.target.value)}
          className="w-full border-b border-gray-400 outline-none text-sm py-1"
        />
        <div className="text-xs text-right text-gray-500 mt-1">
          {name.length}/50
        </div>
        <div className="flex justify-end mt-4 gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-1 text-sm text-gray-600 hover:text-black"
          >
            취소
          </button>
          <button
            onClick={() => onConfirm(name)}
            className="px-4 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenameChatRoomModal;
