import React from "react";
import {
  ListTodo,
  CheckCircle,
  PercentCircle,
  BarChart3,
} from "lucide-react";

const QuizStatsPanel = ({ stats }) => {
  if (!stats) return null;
  const {
    totalSubmissions = 0,
    correctSubmissions = 0,
    accuracy = 0,
  } = stats;

  return (
    <div className="max-w-[1025px] mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BarChart3 className="text-green-600" size={22} />
        퀴즈 통계
      </h2>

      {/* 상단 통계 박스 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border rounded-xl p-5 shadow flex items-center gap-4">
          <ListTodo className="text-green-600" size={28} />
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
    </div>
  );
};

export default QuizStatsPanel;
