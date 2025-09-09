// src/pages/quiz/QuizStatsPage.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getQuizStats } from "../../api/quizApi";

// 컴포넌트
import QuizStatsPanel from "../../components/quiz/QuizStatsPanel";
import QuizStatsChart from "../../components/quiz/QuizStatsChart";
import QuizSideBar from "../../Layout/QuizSideBar";
import { HelpCircle } from "lucide-react";

const QuizStatsPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // 가이드 버튼 상태 (다른 페이지와 동일)
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [showGuideTooltip, setShowGuideTooltip] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("quiz_guide_seen");
    if (seen !== "true") setShowGuideTooltip(true);
  }, []);
  const handleGuideClick = () => {
    setIsGuideOpen(true);
    setShowGuideTooltip(false);
    localStorage.setItem("quiz_guide_seen", "true");
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!user?.user_id) {
          setErr("로그인이 필요합니다.");
          return;
        }
        const result = await getQuizStats(user.user_id);
        setStats(result || null);
      } catch (e) {
        console.error("퀴즈 통계 가져오기 실패:", e);
        setErr("통계를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user?.user_id]);

  return (
    <div className="w-full min-h-screen pt-4 pl-[164px]">
      {/* 좌측 사이드바 */}
      <QuizSideBar />

      {/* 본문 카드 (Practice/Test 규격) */}
      <div className="max-w-6xl mx-auto pt-8 mt-8 bg-white shadow-xl rounded-2xl border border-gray-300 p-7 relative">
        {/* 가이드 버튼 */}
        <button
          onClick={handleGuideClick}
          className="absolute top-4 right-4 text-gray-500 hover:text-black"
          title="가이드 보기"
        >
          <HelpCircle size={24} />
          {showGuideTooltip && (
            <div className="absolute top-[-2px] right-[-6px] w-[7px] h-[7px] bg-rose-600 rounded-full shadow-sm" />
          )}
        </button>

        {/* 타이틀 */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2 tracking-wide">
            퀴즈 통계
          </h1>
          <p className="text-gray-500 text-sm">내 퀴즈 활동을 한눈에 확인하세요.</p>
        </div>

        {/* 컨텐츠 */}
        {loading ? (
          <p className="text-sm text-gray-500">통계를 불러오는 중…</p>
        ) : err ? (
          <p className="text-sm text-red-500">{err}</p>
        ) : !stats ? (
          <p className="text-sm text-gray-500">표시할 통계가 없습니다.</p>
        ) : (
          <>
            {/* 상단 요약 패널 */}
            <div className="mb-8">
              <QuizStatsPanel stats={stats} />
            </div>

            {/* 그래프 */}
            <div className="w-full">
              <QuizStatsChart solvedByLanguage={stats.solvedByLanguage} />
            </div>
          </>
        )}
      </div>

      {/* (선택) 가이드 모달 연결 필요 시 여기에서 열기 */}
      {isGuideOpen && null}
    </div>
  );
};

export default QuizStatsPage;
