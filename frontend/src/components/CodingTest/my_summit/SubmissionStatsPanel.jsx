import React from "react";
import SubmissionStatsChart from "./SubmissionStatsChart";

const SubmissionStatsPanel = ({ stats }) => {
  if (!stats) return null;

  const {
    totalSubmissions = 0,
    correctSubmissions = 0,
    accuracy = 0,
    solvedByDifficulty = {},
    weeklySubmissions = [],
  } = stats;

  const difficultyEntries = Object.entries(solvedByDifficulty || {});

  return (
    <div className="max-w-[1025px] mx-auto">
      <h2 className="text-2xl font-bold mb-6">📊 내 코딩 테스트 통계</h2>

      {/* 상단 통계 박스 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="bg-green-100 p-5 rounded-xl shadow">
          <p className="text-gray-600 text-sm mb-1">총 제출</p>
          <p className="text-2xl font-bold text-green-700">{totalSubmissions}</p>
        </div>
        <div className="bg-blue-100 p-5 rounded-xl shadow">
          <p className="text-gray-600 text-sm mb-1">정답 수</p>
          <p className="text-2xl font-bold text-blue-700">{correctSubmissions}</p>
        </div>
        <div className="bg-yellow-100 p-5 rounded-xl shadow">
          <p className="text-gray-600 text-sm mb-1">정답률</p>
          <p className="text-2xl font-bold text-yellow-700">{accuracy.toFixed(1)}%</p>
        </div>
      </div>

      {/* 난이도별 정답 수 */}
      <div className="bg-white rounded-xl p-5 shadow-md mb-8">
        <h3 className="text-lg font-semibold mb-3">난이도별 정답 수</h3>
        <ul className="flex space-x-6 text-sm">
          {difficultyEntries.length > 0 ? (
            difficultyEntries.map(([level, count]) => (
              <li key={level}>
                <span className="font-medium">{level}:</span> {count}개
              </li>
            ))
          ) : (
            <li className="text-gray-500">데이터가 없습니다.</li>
          )}
        </ul>
      </div>

    </div>
  );
};

export default SubmissionStatsPanel;
