import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const QuizSideBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const currentCategory = queryParams.get("category") || "practice";

  const handleMenuClick = (category) => {
    navigate(`/quizpage?category=${category}`);
  };

  return (
    <div
      className="absolute left-[70px] w-[260px] bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden z-40"
      style={{ top: "120px" }}
    >
      {/* 상단 헤더 */}
      <div className="h-[56px] flex items-center px-6 bg-[#88C078] rounded-t-2xl shadow-sm">
        <h1 className="text-[18px] font-semibold text-black tracking-wide">개념퀴즈</h1>
      </div>

      {/* 카테고리 목록 */}
      <div className="divide-y divide-gray-100">
        {/* 연습 퀴즈 */}
        <div
          className={`px-6 py-4 cursor-pointer text-[16px] font-semibold transition-all duration-150 ${
            currentCategory === "practice"
              ? "bg-[#D9D9D9] text-gray-800"
              : "hover:bg-gray-100 text-gray-600"
          }`}
          onClick={() => handleMenuClick("practice")}
        >
          연습 문제
        </div>

        {/* 퀴즈 테스트 */}
        <div
          className={`px-6 py-4 cursor-pointer text-[16px] font-semibold transition-all duration-150 ${
            currentCategory === "test"
              ? "bg-[#D9D9D9] text-gray-800"
              : "hover:bg-gray-100 text-gray-600"
          }`}
          onClick={() => handleMenuClick("test")}
        >
          실전 문제
        </div>
        {/* 오답 노트 */}
        <div
          className={`px-6 py-4 cursor-pointer text-[16px] font-semibold transition-all duration-150 ${
            currentCategory === "review"
              ? "bg-[#D9D9D9] text-gray-800"
              : "hover:bg-gray-100 text-gray-600"
          }`}
          onClick={() => handleMenuClick("review")}
        >
          오답 노트
        </div>
        {/* 사용자 정의 퀴즈 */}
        <div
          className={`px-6 py-4 cursor-pointer text-[16px] font-semibold transition-all duration-150 ${
            currentCategory === "user"
              ? "bg-[#D9D9D9] text-gray-800"
              : "hover:bg-gray-100 text-gray-600"
          }`}
          onClick={() => handleMenuClick("user")}
        >
          문제 만들기
        </div>
        {/* 제출 내역 */}
        <div
          className={`px-6 py-4 cursor-pointer text-[16px] font-semibold transition-all duration-150 ${
            currentCategory === "history"
              ? "bg-[#D9D9D9] text-gray-800"
              : "hover:bg-gray-100 text-gray-600"
          }`}
          onClick={() => handleMenuClick("history")}
        >
          제출 내역
        </div>
        {/* 통계*/}
        <div
          className={`px-6 py-4 cursor-pointer text-[16px] font-semibold transition-all duration-150 ${
            currentCategory === "stats"
              ? "bg-[#D9D9D9] text-gray-800"
              : "hover:bg-gray-100 text-gray-600"
          }`}
          onClick={() => handleMenuClick("stats")}
        >
          퀴즈 통계
        </div>

        
      </div>
    </div>
  );
};

export default QuizSideBar;
