import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 w-full bg-navbar h-[100px] shadow-md flex items-center px-12 z-50">
      {/* 로고 */}
      <div className="flex items-center">
        <img
          src="/path-to-logo.png"
          alt="Coala Logo"
          className="w-[50px] h-[50px] mr-3"
        />
        <span className="text-[36px] font-[Figma Hand] text-[#2A3F30]">Coala</span>
      </div>

      {/* 메뉴 */}
      <div className="ml-auto flex gap-40">
        <Link
          to="/StudyMaterialsPage"
          className="text-[28px] text-black hover:text-gray-700"
        >
          학습자료
        </Link>
        <Link
          to="/quiz"
          className="text-[28px] text-black hover:text-gray-700"
        >
          퀴즈문제
        </Link>
        <Link
          to="/coding"
          className="text-[28px] text-black hover:text-gray-700"
        >
          자율코딩
        </Link>
        <Link
          to="/board"
          className="text-[28px] text-black hover:text-gray-700"
        >
          게시판
        </Link>
        <Link
          to="/mypage"
          className="text-[28px] text-black hover:text-gray-700"
        >
          마이페이지
        </Link>
      </div>

      {/* 오른쪽 버튼 */}
      <div className="ml-auto">
        <div className="bg-[#A7DA9B] w-[132px] h-[116px] flex justify-center items-center rounded-full border border-black">
          <span className="text-center text-black"></span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
