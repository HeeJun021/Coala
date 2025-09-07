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
      <div className="bg-white text-gray-900 rounded-lg p-6 w-[360px] shadow-xl border border-gray-200">
        {/* 제목 */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Pencil size={18} className="text-blue-600" />
          ERD 이름 수정
        </h2>

        {/* 입력 필드 */}
        <input
          className="w-full px-3 py-2 rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="새 이름을 입력하세요"
        />

        {/* 버튼 */}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm text-gray-700"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-semibold text-white"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditErdNameModal;
