import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReportTrendChart from "./component/ReportTrendChart";
import {
  fetchAdminSummary,
  fetchRecentReports,
  fetchWeeklyReportTrend,
} from "../api/adminApi";

const AdminDashboardPage = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [todayReports, setTodayReports] = useState(0);
  const [recentReports, setRecentReports] = useState([]);
  const [trendData, setTrendData] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const summary = await fetchAdminSummary();
        const reports = await fetchRecentReports();
        const trend = await fetchWeeklyReportTrend();

        setTotalUsers(summary.user_count);
        setTotalPosts(summary.post_count);
        setTotalComments(summary.comment_count);
        setTodayReports(summary.today_reports);
        setRecentReports(
          reports.map((r, idx) => ({
            id: idx,
            type: r.type,
            reason: r.reason,
            targetId: r.target_id,
            postId: r.post_id, // 게시글 ID도 함께 받는다고 가정
            reporter: r.reporter_id,
            date: new Date(r.created_at).toLocaleDateString("ko-KR"),
          }))
        );
        setTrendData(trend);
      } catch (error) {
        console.error("관리자 데이터 불러오기 실패:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8 px-4 md:px-8">
      <h1 className="text-3xl font-bold">📊 관리자 대시보드</h1>

      {/* 통계 카드 영역 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DashboardCard title="오늘 신고 수" value={todayReports} color="bg-red-100" />
        <DashboardCard title="전체 사용자" value={totalUsers} color="bg-blue-100" />
        <DashboardCard title="전체 게시글" value={totalPosts} color="bg-green-100" />
        <DashboardCard title="전체 댓글" value={totalComments} color="bg-yellow-100" />
      </div>

      {/* 최근 신고된 항목 목록 */}
      <div className="bg-white shadow-md rounded p-4">
        <h2 className="text-xl font-semibold mb-4">🆘 최근 신고된 항목</h2>
        <ul className="divide-y divide-gray-200">
          {recentReports.length === 0 ? (
            <p className="text-gray-500">신고 내역이 없습니다.</p>
          ) : (
            recentReports.map((report) => (
              <li
                key={report.id}
                className="py-2 cursor-pointer hover:bg-gray-50 px-2 rounded"
                onClick={() => navigate(`/admin/posts/${report.postId}`)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-red-600">[{report.type}]</span>{" "}
                    {report.reason} →
                    <span className="text-sm text-gray-600 ml-1">
                      대상 ID: {report.targetId} | 신고자: {report.reporter}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">{report.date}</span>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* 아래에 추가할 그래프 영역 */}
      <div className="bg-white rounded shadow p-6 mt-8">
        <h2 className="text-lg font-bold mb-4">📈 최근 7일 신고 추이</h2>
        <ReportTrendChart data={trendData} />
      </div>
    </div>
  );
};

// 간단한 카드 UI 컴포넌트
const DashboardCard = ({ title, value, color }) => {
  return (
    <div className={`rounded shadow p-4 ${color}`}>
      <p className="text-sm text-gray-700">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

export default AdminDashboardPage;
