import React, { useState } from "react";
import { PlusCircle } from "lucide-react";

const CreateErdModal = ({ onClose, onCreate }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return alert("ERD 이름을 입력하세요.");
    onCreate({ name, description });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-[#2a2a3c] text-white p-6 rounded-lg w-[400px] shadow-xl">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <PlusCircle size={18} className="text-green-400" />
          새 ERD 만들기
        </h2>

        <div className="mb-3">
          <label className="block text-sm mb-1">ERD 이름</label>
          <input
            type="text"
            className="w-full px-3 py-2 rounded bg-[#1f1f2b] border border-gray-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 회원 인증 시스템"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-1">설명 (선택)</label>
          <textarea
            className="w-full px-3 py-2 rounded bg-[#1f1f2b] border border-gray-500 resize-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="간단한 설명을 입력하세요"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm"
          >
            취소
          </button>
          <button
            onClick={handleCreate}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold"
          >
            ✔ 만들기
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateErdModal;
