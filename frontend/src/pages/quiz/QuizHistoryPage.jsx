import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getQuizStats } from "../../api/quizApi";

import QuizSubmissionTable from "../../components/quiz/QuizSubmissionTable";
import QuizSideBar from "../../Layout/QuizSideBar";

const QuizHistoryPage = () => {
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
    <div className="pr-32 mt-3">
      <QuizSideBar />
      {stats && (
        <>
          {/* 하단 제출 내역 테이블 */}
          <QuizSubmissionTable userId={user?.user_id} />
        </>
      )}
    </div>
  );
};

export default QuizHistoryPage;
