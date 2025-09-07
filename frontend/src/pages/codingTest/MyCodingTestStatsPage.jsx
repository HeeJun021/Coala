// frontend/src/pages/codingTest/MyCodingTestStatsPage.jsx
import React, { useEffect, useState } from "react";
import CodingTestSidebar from "../../Layout/CodingTestSidebar";
import SubmissionStatsPanel from "../../components/CodingTest/my_summit/SubmissionStatsPanel";
import SubmissionStatsChart from "../../components/CodingTest/my_summit/SubmissionStatsChart";
import { getSubmissionStats } from "../../api/codingTestApi";
import { useAuth } from "../../context/AuthContext";

const MyCodingTestStatsPage = () => {
  const [stats, setStats] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.user_id) return;
    (async () => {
      try {
        const statsData = await getSubmissionStats();
        setStats(statsData);
      } catch (err) {
        console.error("❌ 통계 불러오기 실패:", err);
      }
    })();
  }, [user]);

  return (
    <div className="relative min-h-screen">
      {/* 사이드바 (코테 페이지와 동일 방식) */}
      <CodingTestSidebar />

      {/* 본문 */}
      <div className="ml-[100px] p-6 bg-[#F9FAFB] min-h-screen">
        <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl border border-gray-200 p-6 mt-6">

          {stats ? (
            <>
              <SubmissionStatsPanel stats={stats} />
              <div className="max-w-5xl mx-auto mt-8">
                <SubmissionStatsChart
                  weeklyData={stats.weeklySubmissions}
                  difficultyData={stats.solvedByDifficulty}
                />
              </div>
            </>
          ) : (
            <div className="text-gray-500">📊 통계 데이터를 불러오는 중입니다...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyCodingTestStatsPage;
