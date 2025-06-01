import React, { useState } from "react";
import { Pencil } from "lucide-react";

const EditErdNameModal = ({ initialName, onClose, onSubmit }) => {
  const [newName, setNewName] = useState(initialName ?? "");

  const handleSave = () => {
    if (newName.trim()) {
      onSubmit(newName.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[1000]">
      <div className="bg-[#1e1e2f] text-white rounded-lg p-6 w-[360px] shadow-xl border border-gray-700">
        {/* 제목 */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Pencil size={18} className="text-blue-400" />
          ERD 이름 수정
        </h2>

        {/* 입력 필드 */}
        <input
          className="w-full px-3 py-2 rounded border border-gray-600 bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="새 이름을 입력하세요"
        />

        {/* 버튼 */}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditErdNameModal;
