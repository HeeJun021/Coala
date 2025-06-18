import React from "react";

const AlertModal = ({ isOpen, message, onConfirm, onCancel, isConfirm = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[360px] shadow-xl">
        <p className="text-base text-gray-800 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          {isConfirm && (
            <button
              onClick={onCancel}
              className="px-4 py-1.5 rounded bg-gray-300 text-gray-800 hover:bg-gray-400 transition"
            >
              취소
            </button>
          )}
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 transition"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
