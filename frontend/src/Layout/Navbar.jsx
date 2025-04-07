import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, handleLogout, loading } = useAuth();
  const navigate = useNavigate();

  const logoutAndRedirect = async () => {
    await handleLogout();
    navigate("/");
    window.location.reload();
  };

  if (loading) return null;

  // 메뉴 항목 배열
  const menuItems = [
    { path: "/StudyMaterialsPage", label: "학습자료" },
    { path: "/quizpage", label: "퀴즈문제" },
    { path: "/coding", label: "자율코딩" },
    { path: "/codingtest", label: "코딩테스트" },
    { path: "/board", label: "게시판" },
    { path: "/mypage", label: "마이페이지" }
  ];

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

      {/* 메뉴 */}
      <div className="flex-1 flex justify-center gap-8">
        {menuItems.map((item, index) => {
          // "마이페이지" 항목은 로그인 여부에 따라 경로를 변경
          const path =
            item.path === "/mypage" ? (user ? "/mypage" : "/login") : item.path;
          return (
            <Link
              key={index}
              to={path}
              className="text-[16px] text-white hover:text-[#F8F3E2] font-medium"
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* 로그인 상태 확인 후 버튼 표시 */}
      {user ? (
        <div className="flex items-center gap-4">
          <span className="text-white">{user.nickname}님</span>
          <button
            onClick={logoutAndRedirect}
            className="bg-[#F8F3E2] text-[#81A978] px-4 py-2 rounded-md font-medium hover:bg-[#e6ddc9]"
          >
            로그아웃
          </button>
        </div>
      ) : (
        <div className="flex gap-4">
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
