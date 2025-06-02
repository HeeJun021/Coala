import React from "react";
import { useNavigate } from "react-router-dom";

const ResultModal = ({
  isCorrect,
  passed,
  total,
  onClose,
  testId,
  rating,
  ratingDiff,
  isFirstCorrect,
  eucalyptusReward, // ✅ 유칼립투스 prop 추가
}) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
      <div className="bg-white text-black rounded-xl shadow-xl p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-2">
          {isCorrect ? "🎉 정답입니다!" : "❌ 아쉽습니다!"}
        </h2>
        <p className="text-gray-700">
          {isCorrect
            ? "모든 테스트케이스를 통과했어요!"
            : "일부 테스트케이스를 통과하지 못했어요."}
        </p>
        <div className="text-xl font-semibold text-blue-600 my-4">
          {passed} / {total} 테스트 통과
        </div>

        {/* ✅ 레이팅 보상 표시 */}
        {isCorrect && (
          <div className="text-sm text-green-700 bg-green-100 rounded p-3 mt-2">
            <p className="font-semibold">🎖️ 현재 레이팅: {rating}</p>
            {isFirstCorrect ? (
              <>
                <p className="text-sm">+{ratingDiff}점 획득!</p>
                {eucalyptusReward > 0 && (
                  <p className="text-sm mt-1 text-emerald-600">
                    🌿 유칼립투스 {eucalyptusReward}개 획득!
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-600">
                이전에 푼 문제입니다. 레이팅은 증가하지 않았어요.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-center gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
          >
            닫기
          </button>
          {isCorrect && (
            <button
              onClick={() => navigate(`/codingtest/correct/${testId}`)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
            >
              다른 사람의 풀이 보기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
