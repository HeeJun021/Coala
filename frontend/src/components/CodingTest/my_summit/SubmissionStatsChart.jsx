import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  CalendarClock,
  PieChart as PieChartIcon,
} from "lucide-react";

// 색상
const COLORS = ["#34d399", "#60a5fa", "#facc15", "#fb923c", "#f472b6"];

// 난이도 숫자(string) → 라벨
const LEVEL_LABELS = {
  "1": "Lv.1",
  "2": "Lv.2",
  "3": "Lv.3",
  "4": "Lv.4",
  "5": "Lv.5",
};

// 라벨 커스터마이징
const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, name }) => {
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

const SubmissionStatsChart = ({ weeklyData, difficultyData }) => {
  const pieData = Object.entries(difficultyData).map(([key, value]) => ({
    name: LEVEL_LABELS[key] || key,
    value,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* 주간 제출 추이 */}
      <div className="bg-white border rounded-xl shadow-md p-5 max-w-[600px] mx-auto w-full">
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock className="text-green-600 w-5 h-5" />
          <h3 className="text-lg font-semibold text-gray-800">주간 제출 추이</h3>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={weeklyData}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
                fontSize: "13px",
              }}
              formatter={(value) => [`${value}개`, "제출"]}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#34d399"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 난이도별 정답 비율 */}
      <div className="bg-white border rounded-xl shadow-md p-5 max-w-[600px] mx-auto w-full">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="text-yellow-600 w-5 h-5" />
          <h3 className="text-lg font-semibold text-gray-800">난이도별 정답 비율</h3>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={4}
              cornerRadius={8}
              labelLine={false}
              label={pieData.length > 1 ? renderCustomizedLabel : false}
            >
              {pieData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value}개`, name]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
                fontSize: "13px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SubmissionStatsChart;
