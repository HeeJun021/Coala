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
      className="absolute left-[33px] w-[260px] bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden z-40"
      style={{ top: "239px" }}
    >
      {/* ✅ 상단 헤더 */}
      <div className="h-[56px] flex items-center px-6 bg-[#A7DA9B] rounded-t-2xl shadow-sm">
        <h1 className="text-[18px] font-semibold text-white tracking-wide">🧠 퀴즈</h1>
      </div>

      {/* ✅ 카테고리 목록 */}
      <div className="divide-y divide-gray-100">
        {/* 연습 퀴즈 */}
        <div
          className={`px-6 py-4 cursor-pointer text-[16px] font-semibold transition-all duration-150 ${
            currentCategory === "practice"
              ? "bg-[#88C078] text-white"
              : "hover:bg-gray-100 text-gray-800"
          }`}
          onClick={() => handleMenuClick("practice")}
        >
          연습 퀴즈
        </div>

        {/* 퀴즈 테스트 */}
        <div
          className={`px-6 py-4 cursor-pointer text-[16px] font-semibold transition-all duration-150 ${
            currentCategory === "test"
              ? "bg-[#88C078] text-white"
              : "hover:bg-gray-100 text-gray-800"
          }`}
          onClick={() => handleMenuClick("test")}
        >
          퀴즈 테스트
        </div>

        {/* 사용자 정의 퀴즈 */}
        <div
          className={`px-6 py-4 cursor-pointer text-[16px] font-semibold transition-all duration-150 ${
            currentCategory === "user"
              ? "bg-[#88C078] text-white"
              : "hover:bg-gray-100 text-gray-800"
          }`}
          onClick={() => handleMenuClick("user")}
        >
          사용자 정의 퀴즈
        </div>
      </div>
    </div>
  );
};

export default QuizSideBar;
