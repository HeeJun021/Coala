import React from "react";
import { AlertTriangle, X, Check } from "lucide-react";

const ConfirmRatingLossModal = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white text-gray-800 rounded-xl px-8 py-6 shadow-xl max-w-md w-full border border-gray-200 text-center">
        {/* 경고 아이콘 */}
        <div className="flex justify-center mb-4">
          <AlertTriangle className="w-9 h-9 text-rose-500" />
        </div>

        {/* 제목 */}
        <h2 className="text-xl font-bold text-rose-600 mb-3">레이팅 주의</h2>

        {/* 메시지 */}
        <p className="text-sm text-gray-700 leading-relaxed mb-5">
          다른 사람의 코드를 확인하면 해당 문제는 정답을 맞춰도 <br />
          <span className="font-semibold text-red-500">
            레이팅이 오르지 않습니다.
          </span>
          <br />
          그래도 보시겠습니까?
        </p>

        {/* 버튼 영역 */}
        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 flex items-center gap-1 transition"
          >
            <X className="w-4 h-4" />
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-teal-500 text-white hover:bg-teal-600 flex items-center gap-1 transition"
          >
            <Check className="w-4 h-4" />
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmRatingLossModal;
