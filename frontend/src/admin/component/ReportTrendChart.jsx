import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const getLast7Days = () => {
  const today = new Date();
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const formatted = date.toLocaleDateString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
    });
    days.push(formatted.replace(".", "-").replace(" ", "").replace(".", ""));
  }

  return days;
};

const ReportTrendChart = ({ data }) => {
  const days = getLast7Days();

  // 날짜 기준으로 0 채움
  const mappedData = days.map((date) => {
    const found = data.find((item) => item.date === date);
    return {
      date,
      reports: found ? found.reports : 0,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={mappedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="reports"
          stroke="#f87171"
          strokeWidth={3}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ReportTrendChart;
