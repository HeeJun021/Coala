import React from "react";
import { X } from "lucide-react";

export default function PortfolioGuideDetail({ step, onClose }) {
  if (!step) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 p-8 relative">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 제목 */}
        <h2 className="text-2xl font-bold mb-4 border-b pb-3">{step.title}</h2>

        {/* 본문 */}
        <div className="space-y-6">
          <p className="whitespace-pre-wrap text-gray-700 leading-relaxed text-base">
            {step.detail}
          </p>

          {/* 이미지 */}
          {step.image && (
            <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50 flex items-center justify-center">
              <img
                src={step.image}
                alt={`${step.title} 예시`}
                className="max-h-[420px] w-auto object-contain"
              />
            </div>
          )}
        </div>

        {/* 닫기 버튼 */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
