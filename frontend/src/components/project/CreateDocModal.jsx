import React, { useState } from "react";
import { FilePlus2 } from "lucide-react";

const CreateDocModal = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState("");

  const handleCreate = () => {
    if (!title.trim()) return alert("문서 제목을 입력하세요.");
    onCreate({ title }); // ✅ description 제거
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white text-black p-6 rounded-lg w-[400px] shadow-xl">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <FilePlus2 size={18} className="text-green-600" />
          새 문서 만들기
        </h2>

        <div className="mb-4">
          <label className="block text-sm mb-1">문서 제목</label>
          <input
            type="text"
            className="w-full px-3 py-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 focus:outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 요구사항 명세서"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-300 hover:bg-gray-400 rounded text-sm"
          >
            취소
          </button>
          <button
            onClick={handleCreate}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold"
          >
            ✔ 만들기
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateDocModal;
