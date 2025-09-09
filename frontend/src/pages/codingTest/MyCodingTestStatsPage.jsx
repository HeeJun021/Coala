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
    <div className="w-full min-h-screen pt-4 pl-[144px] bg-[#F9FAFB]">
      {/* 좌측 사이드바 (코테 목록 페이지와 동일 컴포넌트/위치) */}
      <CodingTestSidebar />

      {/* 본문 카드 — 코딩테스트 목록 페이지와 동일한 규격 */}
      <div className="max-w-5xl mx-auto pt-8 mt-8 bg-white shadow-xl rounded-2xl border border-gray-300 p-7 relative">
        {/* 페이지 헤더 (타이포/간격 동일) */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h1 className="text-3xl font-extrabold text-gray-800 tracking-wide">
              <span className="text-black">코딩 테스트 통계</span>
            </h1>
          </div>

          <p className="text-sm text-gray-500 pt-2 leading-relaxed">
            최근 제출 추이와 난이도별 정답 분포를 확인해보세요.
          </p>
        </div>

        {/* 콘텐츠 */}
        {stats ? (
          <>
            <SubmissionStatsPanel stats={stats} />

            {/* 카드 내부 추가 섹션 간격 통일 */}
            <div className="mt-8">
              <SubmissionStatsChart
                weeklyData={stats.weeklySubmissions}
                difficultyData={stats.solvedByDifficulty}
              />
            </div>
          </>
        ) : (
          <div className="text-gray-500 text-sm">📊 통계 데이터를 불러오는 중입니다...</div>
        )}
      </div>
    </div>
  );
};

export default MyCodingTestStatsPage;
