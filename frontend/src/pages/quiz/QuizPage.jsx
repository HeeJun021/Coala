// frontend/src/pages/quiz/QuizPage.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import PracticeQuiz from "./PracticeQuiz";
import TestQuiz from "./TestQuiz";
import UserQuiz from "./UserQuiz";
import QuizHistoryPage from "./QuizHistoryPage";
import QuizStatsPage from "./QuizStatsPage";
import QuizReviewPage from "./QuizReviewPage";

const QuizPage = ({ userData }) => {
  const location = useLocation();

  // 현재 URL에서 'category' 값 가져오기 (기본값: practice)
  const queryParams = new URLSearchParams(location.search);
  const currentCategory = queryParams.get("category") || "practice";

  // URL에 따라 렌더링할 컴포넌트 결정
  const renderQuizComponent = () => {
    switch (currentCategory) {
      case "practice":
        return <PracticeQuiz />;
      case "test":
        return <TestQuiz />;
      case "user":
        return <UserQuiz userData={userData} />;
      case "stats":
        return <QuizStatsPage />;
      case "history":
        return <QuizHistoryPage />;
      case "review":
        return <QuizReviewPage />;
      default:
        return <PracticeQuiz />; // 기본값
    }
  };

  return (
    // 부모는 높이만 보장하고, 좌우 여백은 컨테이너에서 통일
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* 자식 컴포넌트에서 사이드바/콘텐츠를 배치하므로 margin-left 제거 */}
        {renderQuizComponent()}
      </div>
    </div>
  );
};

export default QuizPage;
