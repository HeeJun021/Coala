import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#82ca9d", "#8884d8", "#ffc658"];

const SubmissionStatsChart = ({ weeklyData, difficultyData }) => {
  const pieData = Object.entries(difficultyData).map(([key, value]) => ({
    name: key,
    value,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      {/* 주간 제출 그래프 */}
      <div className="bg-white p-4 rounded-lg shadow max-w-[600px] mx-auto w-full">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">주간 제출 추이</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#4ade80" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 난이도별 정답 비율 */}
      <div className="bg-white p-4 rounded-lg shadow max-w-[600px] mx-auto w-full">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">난이도별 정답 비율</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              outerRadius={80}
              label
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SubmissionStatsChart;
