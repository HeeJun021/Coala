import React from "react";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const COLORS = ["#60a5fa", "#fbbf24", "#34d399", "#fb7185", "#a78bfa", "#f472b6"];

const QuizStatsChart = ({ solvedByLanguage = [] }) => {
  // 원형: 언어별 풀이 비율
  const totalSubmissions = solvedByLanguage.reduce((sum, lang) => sum + lang.submissions, 0);
  const languagePieData = solvedByLanguage
    .filter(lang => lang.submissions > 0)
    .map(lang => ({
      name: lang.language_name,
      value: Number(((lang.submissions / totalSubmissions) * 100).toFixed(1))
    }));

  // 막대: 언어별 정답률
  const languageBarData = solvedByLanguage.map(lang => ({
    name: lang.language_name,
    accuracy: lang.accuracy,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-6">
      {/* 언어별 풀이 비율 (도넛) */}
      <div className="bg-white border rounded-xl shadow-md p-5 max-w-[500px] mx-auto w-full">
        <div className="font-semibold mb-4 text-lg">언어별 풀이 비율</div>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={languagePieData}
              dataKey="value"
              nameKey="name"
              cx="50%" cy="50%"
              innerRadius={50}
              outerRadius={80}
              label
            >
              {languagePieData.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v, n) => [`${v}%`, n]} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 언어별 정답률 (막대) */}
      <div className="bg-white border rounded-xl shadow-md p-5 max-w-[600px] mx-auto w-full">
        <div className="font-semibold mb-4 text-lg">언어별 정답률</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={languageBarData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={(v) => `${v}%`} />
            <Legend />
            <Bar dataKey="accuracy" fill="#34d399" name="정답률" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default QuizStatsChart;
