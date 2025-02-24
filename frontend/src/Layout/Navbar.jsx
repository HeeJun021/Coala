import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 w-full bg-navbar h-[100px] shadow-md flex items-center px-12 z-50">
      {/* ✅ 로고 영역 */}
      <div className="flex items-center">
        <img
          src="/path-to-logo.png" // 로고 이미지 경로
          alt="Coala Logo"
          className="w-[50px] h-[50px] mr-3"
        />
        <span className="text-[36px] font-[Figma Hand] text-[#2A3F30]">
          Coala
        </span>
      </div>

      {/* ✅ 네비게이션 메뉴 */}
      <div className="ml-auto flex gap-40">
        <Link to="/StudyMaterialsPage" className="text-[28px] text-black hover:text-gray-700">
          학습자료
        </Link>
        <Link to="/quiz" className="text-[28px] text-black hover:text-gray-700">
          퀴즈문제
        </Link>
        <Link to="/coding" className="text-[28px] text-black hover:text-gray-700">
          자율코딩
        </Link>
        <Link to="/board" className="text-[28px] text-black hover:text-gray-700">
          게시판
        </Link>
        <Link to="/mypage" className="text-[28px] text-black hover:text-gray-700">
          마이페이지
        </Link>
      </div>

      {/* ✅ 오른쪽 버튼 (추후 기능 추가 가능) */}
      <div className="ml-auto">
        <div className="bg-[#A7DA9B] w-[132px] h-[116px] flex justify-center items-center rounded-full border border-black">
          <span className="text-center text-black"></span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

//1️⃣ 메뉴 항목을 map 함수로 자동화
//const menuItems = [
//  { path: "/StudyMaterialsPage", label: "학습자료" },
//  { path: "/quiz", label: "퀴즈문제" },
//  { path: "/coding", label: "자율코딩" },
//  { path: "/board", label: "게시판" },
//  { path: "/mypage", label: "마이페이지" },
//];

//return (
//  <div className="ml-auto flex gap-40">
//    {menuItems.map((item) => (
//      <Link key={item.path} to={item.path} className="text-[28px] text-black hover:text-gray-700">
//        {item.label}
//      </Link>
//    ))}
//  </div>
//);
//반복되는 Link 요소를 배열로 정리하면 유지보수가 편리해짐.