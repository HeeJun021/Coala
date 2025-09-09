import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PieChart as PieChartIcon, BarChart3 } from "lucide-react";

// 색상 팔레트
const COLORS = ["#34d399", "#60a5fa", "#facc15", "#fb923c", "#f472b6"];

// 도넛 라벨
const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, name }) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 10;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#4B5563"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-[13px] font-semibold"
    >
      {name}
    </text>
  );
};

const QuizStatsChart = ({ solvedByLanguage = [] }) => {
  // 원형 데이터
  const totalSubmissions = solvedByLanguage.reduce(
    (sum, lang) => sum + (lang.submissions || 0),
    0
  );

  const languagePieData =
    totalSubmissions > 0
      ? solvedByLanguage
          .filter((l) => (l.submissions || 0) > 0)
          .map((l) => ({
            name: l.language_name,
            value: Number(((l.submissions / totalSubmissions) * 100).toFixed(1)),
          }))
      : [];

  // 막대 데이터
  const languageBarData = solvedByLanguage.map((l) => ({
    name: l.language_name,
    accuracy: Number(l.accuracy ?? 0),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* 도넛 */}
      <div className="bg-white border rounded-xl shadow-md p-5 max-w-[600px] mx-auto w-full">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="text-yellow-600 w-5 h-5" />
          <h3 className="text-lg font-semibold text-gray-800">언어별 풀이 비율</h3>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={languagePieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={4}
              cornerRadius={8}
              labelLine={false}
              label={languagePieData.length > 1 ? renderCustomizedLabel : false}
            >
              {languagePieData.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value}%`, name]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                fontSize: "13px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 막대 */}
      <div className="bg-white border rounded-xl shadow-md p-5 max-w-[600px] mx-auto w-full">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="text-green-600 w-5 h-5" />
          <h3 className="text-lg font-semibold text-gray-800">언어별 정답률</h3>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <RBarChart data={languageBarData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(v) => `${v}%`}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                fontSize: "13px",
              }}
            />
            <Bar dataKey="accuracy" name="정답률">
              {languageBarData.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} radius={[6, 6, 0, 0]} />
              ))}
            </Bar>
          </RBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default QuizStatsChart;
