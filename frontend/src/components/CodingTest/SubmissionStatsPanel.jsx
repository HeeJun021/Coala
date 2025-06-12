import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";

const COLORS = ["#22c55e", "#f87171"];

const SubmissionStatsPanel = ({ stats }) => {
  const {
    correct_submissions,
    incorrect_submissions,
    level_distribution,
    category_distribution,
    daily_submission_counts,
  } = stats;

  const pieData = [
    { name: "정답", value: correct_submissions },
    { name: "오답", value: incorrect_submissions },
  ];

  const levelData = Object.entries(level_distribution).map(([level, count]) => ({
    level: `Lv.${level}`,
    count,
  }));

  const categoryData = Object.entries(category_distribution).map(([cat, count]) => ({
    category: cat,
    count,
  }));

  return (
    <div className="space-y-10">
      {/* 1단: 정답/오답 + 난이도 분포 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold text-gray-700 mb-4">정답 / 오답 비율</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold text-gray-700 mb-4">난이도별 풀이 수</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={levelData}>
              <XAxis dataKey="level" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2단: 카테고리 분포 */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-bold text-gray-700 mb-4">카테고리별 풀이 수</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryData} layout="vertical">
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="category" width={120} />
            <Tooltip />
            <Bar dataKey="count" fill="#60a5fa" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 3단: 최근 30일 제출 추이 */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-bold text-gray-700 mb-4">최근 30일 제출 추이</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={daily_submission_counts}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SubmissionStatsPanel;
