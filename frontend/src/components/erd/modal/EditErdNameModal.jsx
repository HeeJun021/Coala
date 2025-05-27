import React, { useState } from "react";

const EditErdNameModal = ({ initialName, onClose, onSubmit }) => {
  const [newName, setNewName] = useState(initialName ?? "");

  const handleSave = () => {
    if (newName.trim()) {
      onSubmit(newName.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[1000]">
      <div className="bg-[#1e1e2f] text-white rounded-lg p-6 w-[360px] shadow-lg">
        <h2 className="text-lg font-semibold mb-4">ERD 이름 수정</h2>
        <input
          className="w-full px-3 py-2 rounded border border-gray-600 bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="새 이름을 입력하세요"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditErdNameModal;
