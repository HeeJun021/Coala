import React from "react";
import { Trash2 } from "lucide-react";

const DeleteErdModal = ({ erdName, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-[#2a2a3c] text-white p-6 rounded-lg w-[400px] shadow-xl">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Trash2 size={18} className="text-red-400" />
          ERD 삭제 확인
        </h2>

        <p className="text-sm mb-6">
          <span className="text-red-400 font-semibold">{erdName}</span> 을(를)
          삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-semibold"
          >
            🗑 삭제하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteErdModal;
