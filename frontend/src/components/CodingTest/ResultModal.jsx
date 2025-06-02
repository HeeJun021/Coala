import React from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Leaf,
  ArrowUpCircle,
  Eye,
  X,
} from "lucide-react";

const ResultModal = ({
  isCorrect,
  passed,
  total,
  onClose,
  testId,
  rating,
  ratingDiff,
  isFirstCorrect,
  eucalyptusReward,
}) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white text-gray-800 rounded-2xl shadow-xl border border-gray-200 px-8 py-6 w-full max-w-md text-center relative">
        {/* 상단 아이콘 */}
        <div className="flex justify-center mb-3">
          {isCorrect ? (
            <CheckCircle className="w-10 h-10 text-teal-600" />
          ) : (
            <XCircle className="w-10 h-10 text-rose-500" />
          )}
        </div>

        <h2 className="text-2xl font-bold mb-2">
          {isCorrect ? "정답입니다!" : "아쉽습니다!"}
        </h2>
        <p className="text-gray-600 mb-1">
          {isCorrect
            ? "모든 테스트케이스를 통과했어요!"
            : "일부 테스트케이스를 통과하지 못했어요."}
        </p>
        <div className="text-xl font-semibold text-blue-600 my-4">
          {passed} / {total} 테스트 통과
        </div>

        {/* ✅ 레이팅 및 보상 영역 */}
        {isCorrect && (
          <div className="bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 p-4 text-sm text-left">
            <div className="flex items-center gap-2 font-semibold">
              <ArrowUpCircle className="w-4 h-4" />
              현재 레이팅: {rating}
            </div>

            {isFirstCorrect ? (
              <>
                <div className="mt-2 flex items-center gap-2">
                  <ArrowUpCircle className="w-4 h-4 text-teal-600" />
                  +{ratingDiff}점 획득!
                </div>
                {eucalyptusReward > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-green-600" />
                    유칼립투스 {eucalyptusReward}개 획득!
                  </div>
                )}
              </>
            ) : (
              <div className="mt-2 text-gray-500">
                이전에 푼 문제입니다. 레이팅은 증가하지 않았어요.
              </div>
            )}
          </div>
        )}

        {/* ✅ 버튼 영역 */}
        <div className="flex justify-center gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 flex items-center gap-1 transition"
          >
            <X className="w-4 h-4" />
            닫기
          </button>
          {isCorrect && (
            <button
              onClick={() => navigate(`/codingtest/correct/${testId}`)}
              className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded flex items-center gap-1 transition"
            >
              <Eye className="w-4 h-4" />
              다른 사람의 풀이 보기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
