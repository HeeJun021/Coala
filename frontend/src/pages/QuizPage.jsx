import React from "react";
import { useLocation } from "react-router-dom";
import PracticeQuiz from "./PraticeQuiz";
import TestQuiz from "./TestQuiz";
// import CustomQuiz from "./CustomQuiz";

const QuizPage = () => {
  const location = useLocation();

  // ✅ 현재 URL에서 'category' 값 가져오기 (기본값: practice)
  const queryParams = new URLSearchParams(location.search);
  const currentCategory = queryParams.get("category") || "practice";

  // ✅ URL에 따라 렌더링할 컴포넌트 결정
  const renderQuizComponent = () => {
    switch (currentCategory) {
      case "practice":
        return <PracticeQuiz />;
      case "test":
        return <TestQuiz />;
    //   case "custom":
    //     return <CustomQuiz />;
      default:
        return <PracticeQuiz />; // 기본값
    }
  };

  return (
    <div className="flex min-h-screen bg-beige">

      {/* ✅ 선택된 퀴즈 유형에 따른 콘텐츠 변경 */}
      <div className="ml-[250px] p-6 flex-1">{renderQuizComponent()}</div>
      
    </div>
  );
};

export default QuizPage;
