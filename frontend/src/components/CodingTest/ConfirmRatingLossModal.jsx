import React from "react";

const ConfirmRatingLossModal = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
      <div className="bg-white text-black rounded-lg p-6 shadow-md max-w-sm w-full text-center">
        <h2 className="text-lg font-bold mb-2">⚠️ 경고</h2>
        <p className="text-sm text-gray-800">
          다른 사람의 코드를 확인하면 해당 문제는 정답을 맞춰도 레이팅이 오르지 않습니다.
          그래도 보시겠습니까?
        </p>
        <div className="mt-4 flex justify-center gap-4">
          <button
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            onClick={onCancel}
          >
            취소
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={onConfirm}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmRatingLossModal;
