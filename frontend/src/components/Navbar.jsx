import React from "react";
import { Link } from "react-router-dom";

const Navbar = ({ hideButtons }) => {
  return (
    <nav className="fixed top-0 left-0 w-full bg-[#81A978] h-[70px] shadow-sm flex items-center px-6 z-50">
      {/* 로고 */}
      <div className="flex items-center">
        <Link to="/" className="flex items-center">
          <img
            src="/coala.jpg"
            alt="Coala Logo"
            className="w-[40px] h-[40px] mr-2 rounded-full border border-white"
          />
          <span className="text-[24px] font-bold text-white">Coala</span>
        </Link>
      </div>

      {/* 메뉴 (중앙 정렬) */}
      <div className="flex-1 flex justify-center gap-8">
        {[
          { path: "/StudyMaterialsPage", label: "학습자료" },
          { path: "/quiz", label: "퀴즈문제" },
          { path: "/coding", label: "자율코딩" },
          { path: "/board", label: "게시판" },
          { path: "/mypage", label: "마이페이지" },
        ].map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className="text-[16px] text-white hover:text-[#F8F3E2] font-medium"
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* 회원가입 및 로그인 버튼 */}
      {!hideButtons && (
        <div className="flex gap-4">
          {/* 로그인 버튼을 Link로 수정 */}
          <Link
            to="/login"
            className="bg-[#F8F3E2] text-[#81A978] px-4 py-2 rounded-md font-medium hover:bg-[#e6ddc9]"
          >
            로그인
          </Link>
          <Link
            to="/signup"
            className="bg-[#F8F3E2] text-[#81A978] px-4 py-2 rounded-md font-medium hover:bg-[#e6ddc9]"
          >
            회원가입
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
