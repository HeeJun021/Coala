import React, { useState } from "react";
import { X, Send, Share2, Settings2 } from "lucide-react";

const ConfirmSubmissionModal = ({ onConfirm, onCancel, isSubmitting }) => {
  const [shareSolution, setShareSolution] = useState(true);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleConfirm = () => {
    onConfirm(shareSolution, dontShowAgain);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      {/* width 너무 넓으면 lg-> md로 수정 */}
      <div className="bg-white text-gray-800 rounded-2xl shadow-xl border border-gray-200 p-8 w-full max-w-lg text-center relative">
        <div className="flex justify-center mb-4">
          <Share2 className="w-10 h-10 text-blue-600" />
        </div>

        <h2 className="text-2xl font-bold mb-2">코드 공유 설정</h2>
        <p className="text-gray-600 mb-6">
          정답일 경우, 다른 학습자를 위해 코드를 공유하시겠습니까?
        </p>

        {/* ✅ fieldset의 내부 구조와 클래스를 조정하여 legend 위치를 바로잡았습니다. */}
        <fieldset className="relative text-left p-5 rounded-lg border border-gray-200">
          <legend className="absolute -top-3 left-4 text-sm font-semibold text-gray-700 bg-white px-1">
            코드 공유 옵션
          </legend>
          <div className="space-y-4">
            <div>
              <input
                id="share-true"
                type="radio"
                name="share-option"
                value="true"
                checked={shareSolution === true}
                onChange={() => setShareSolution(true)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer align-middle"
              />
              <label
                htmlFor="share-true"
                className="ml-3 text-sm text-gray-800 cursor-pointer align-middle"
              >
                정답 코드 공유
              </label>
            </div>
            <div>
              <input
                id="share-false"
                type="radio"
                name="share-option"
                value="false"
                checked={shareSolution === false}
                onChange={() => setShareSolution(false)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer align-middle"
              />
              <label
                htmlFor="share-false"
                className="ml-3 text-sm text-gray-800 cursor-pointer align-middle"
              >
                공유 안함
              </label>
            </div>
          </div>
        </fieldset>

        <div className="mt-6">
          <div className="flex items-center justify-center">
            <Settings2 className="w-4 h-4 text-gray-500 mr-2" />
            <input
              id="dont-show-again"
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500 cursor-pointer"
            />
            <label
              htmlFor="dont-show-again"
              className="ml-2 block text-sm text-gray-600 cursor-pointer"
            >
              다음부터 이 창 띄우지 않기
            </label>
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-6 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 flex items-center gap-1 transition"
          >
            <X className="w-4 h-4" />
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-md text-white flex items-center gap-1 transition ${
              isSubmitting
                ? "bg-green-300 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? "제출 중..." : "설정 후 제출"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmSubmissionModal;