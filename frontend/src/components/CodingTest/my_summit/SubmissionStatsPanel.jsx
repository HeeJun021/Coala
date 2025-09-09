import React from "react";
import {
  BarChart3,
  ListTodo ,
  CheckCircle,
  PercentCircle,
} from "lucide-react";

// 난이도 라벨 배경/색상
const getLevelClass = (level) => {
  switch (level) {
    case 1:
      return "bg-green-100 text-green-700";
    case 2:
      return "bg-lime-100 text-lime-700";
    case 3:
      return "bg-yellow-100 text-yellow-700";
    case 4:
      return "bg-orange-100 text-orange-700";
    case 5:
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const SubmissionStatsPanel = ({ stats }) => {
  if (!stats) return null;

  const {
    totalSubmissions = 0,
    correctSubmissions = 0,
    accuracy = 0,
    solvedByDifficulty = {},
  } = stats;

  const difficultyEntries = Object.entries(solvedByDifficulty || {})
    .map(([level, count]) => ({ level: parseInt(level), count }))
    .sort((a, b) => a.level - b.level); // 레벨 순 정렬

  return (
    <div className="max-w-[1025px] mx-auto">

       {/* 상단 통계 박스 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border rounded-xl p-5 shadow flex items-center gap-4">
          <ListTodo  className="text-green-600" size={28} />
          <div>
            <p className="text-sm text-gray-500">총 제출</p>
            <p className="text-2xl font-bold text-gray-800">{totalSubmissions}</p>
          </div>
        </div>
        <div className="bg-white border rounded-xl p-5 shadow flex items-center gap-4">
          <CheckCircle className="text-blue-600" size={28} />
          <div>
            <p className="text-sm text-gray-500">정답 수</p>
            <p className="text-2xl font-bold text-gray-800">{correctSubmissions}</p>
          </div>
        </div>
        <div className="bg-white border rounded-xl p-5 shadow flex items-center gap-4">
          <PercentCircle className="text-yellow-500" size={28} />
          <div>
            <p className="text-sm text-gray-500">정답률</p>
            <p className="text-2xl font-bold text-gray-800">{accuracy.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* 난이도별 정답 수 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border mb-8">
        <h3 className="text-base font-semibold mb-3 text-gray-700">
          난이도별 정답 수
        </h3>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {difficultyEntries.length > 0 ? (
            difficultyEntries.map(({ level, count }) => (
              <li key={level} className="flex items-center gap-1">
                <span
                  className={`text-xs px-2 py-[2px] rounded font-semibold ${getLevelClass(
                    level
                  )}`}
                >
                  Lv.{level}
                </span>
                <span className="text-black">{count}개</span>
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
