// src/pages/quiz/QuizStatsPage.jsx

import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getQuizStats } from "../../api/quizApi";

// 컴포넌트
import QuizStatsPanel from "../../components/quiz/QuizStatsPanel";
import QuizStatsChart from "../../components/quiz/QuizStatsChart";
import QuizSubmissionTable from "../../components/quiz/QuizSubmissionTable";

const QuizStatsPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user?.user_id) {
          const result = await getQuizStats(user.user_id);
          setStats(result);
        }
      } catch (err) {
        console.error("퀴즈 통계 가져오기 실패:", err);
      }
    };
    fetchStats();
  }, [user]);

  return (
    <div className="p-6 mt-3">
      {stats && (
        <>
          {/* 상단 통계 패널 */}
          <QuizStatsPanel stats={stats} />

          {/* 중단 차트 (언어별 비율/정답률) */}
          <div className="max-w-5xl mx-auto">
            <QuizStatsChart solvedByLanguage={stats.solvedByLanguage} />
          </div>

          {/* 하단 제출 내역 테이블 */}
          <QuizSubmissionTable userId={user?.user_id} />
        </>
      )}
    </div>
  );
};

export default QuizStatsPage;
