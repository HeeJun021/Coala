import React, { useState } from "react";
import { FolderPlus, Check } from "lucide-react";

const CreateErdModal = ({ onClose, onCreate }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    if (!name.trim()) {
      alert("ERD 이름을 입력해주세요.");
      return;
    }
    onCreate({ name, description });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-[400px] shadow-2xl">
        <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
          <FolderPlus className="text-yellow-500" size={20} />새 ERD 만들기
        </h2>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ERD 이름
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:border-green-600 font-medium text-gray-800"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 사용자 인증 시스템"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            설명 (선택)
          </label>
          <textarea
            rows={3}
            className="w-full px-3 py-2 border rounded-md border-gray-300 resize-none focus:outline-none focus:border-green-600 font-medium text-gray-800"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="이 ERD에 대한 간단한 설명을 입력하세요"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded text-sm"
          >
            취소
          </button>
          <button
            onClick={handleCreate}
            className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded text-sm font-medium flex items-center gap-2"
          >
            <Check size={16} className="text-white" />
            ERD 생성
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateErdModal;
