import React from "react";
import { Trash2 } from "lucide-react";

const DeleteErdModalWhite = ({ erdName, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white text-gray-800 p-6 rounded-xl w-[400px] shadow-2xl border border-gray-200">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Trash2 size={20} className="text-red-500" />
          ERD 삭제 확인
        </h2>

        <p className="text-sm mb-6 leading-relaxed">
          <span className="font-semibold text-red-600">"{erdName}"</span> ERD를
          정말 삭제하시겠습니까? <br />
          이 작업은 되돌릴 수 없습니다.
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm border border-gray-300"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold"
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteErdModalWhite;
