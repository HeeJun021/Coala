import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const QuizSideBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ 현재 URL에서 'category' 파라미터 가져오기 (기본값: 연습 퀴즈)
  const queryParams = new URLSearchParams(location.search);
  const currentCategory = queryParams.get("category") || "practice";

  // ✅ 메뉴 클릭 시 URL 업데이트
  const handleMenuClick = (category) => {
    console.log("🔹 이동 시도:", `/quizpage?category=${category}`);
    navigate(`/quizpage?category=${category}`); // ✅ URL 변경
  };

  return (
    <div className="absolute top-[239px] left-[33px] w-[243px] bg-white rounded-md shadow-md">
      {/* ✅ 연습 퀴즈 */}
      <div
        className={`h-[54px] flex items-center pl-6 cursor-pointer ${
          currentCategory === "practice" ? "bg-[#A7DA9B]" : "bg-[#EFEFEF]"
        }`}
        onClick={() => handleMenuClick("practice")}
      >
        <span className="text-[18px] font-normal text-black">연습 퀴즈</span>
      </div>

      {/* ✅ 퀴즈 테스트 */}
      <div
        className={`h-[54px] flex items-center pl-6 cursor-pointer ${
          currentCategory === "test" ? "bg-[#A7DA9B]" : "bg-[#EFEFEF]"
        }`}
        onClick={() => handleMenuClick("test")}
      >
        <span className="text-[18px] font-normal text-black">퀴즈 테스트</span>
      </div>

      {/* ✅ 사용자 정의 퀴즈 */}
      <div
        className={`h-[54px] flex items-center pl-6 cursor-pointer ${
          currentCategory === "custom" ? "bg-[#A7DA9B]" : "bg-[#EFEFEF]"
        }`}
        onClick={() => handleMenuClick("custom")}
      >
        <span className="text-[18px] font-normal text-black">사용자 정의 퀴즈</span>
      </div>
    </div>
  );
};

export default QuizSideBar;
