import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, handleLogout, loading } = useAuth();
  const navigate = useNavigate();
  const [hovering, setHovering] = useState(false);

  const logoutAndRedirect = async () => {
    await handleLogout();
    navigate("/");
    window.location.reload();
  };

  if (loading) return null;

  const menuItems = [
    {
      label: "학습자료",
      path: "/StudyMaterialsPage",
      children: ["HTML", "CSS", "JavaScript", "Python"],
    },
    {
      label: "퀴즈문제",
      path: "/quizpage",
      children: ["퀴즈 풀기", "퀴즈 만들기", "사용자 퀴즈"],
    },
    {
      label: "자율코딩",
      path: "/coding",
      children: ["실습 에디터", "코드 저장소"],
    },
    {
      label: "코딩테스트",
      path: "/codingtest",
      children: ["문제 목록", "내 제출", "정답 보기"],
    },
    {
      label: "게시판",
      path: "/board",
      children: ["자유 게시판", "질문 게시판", "코드 게시판", "프로젝트 모집"],
    },
    {
      label: "마이페이지",
      path: user ? "/mypage/modify" : "/login",
      children: ["내 정보", "포트폴리오", "내 학습 현황"],
    },
  ];

  return (
    <div className="relative z-50">
      {/* 상단 바 */}
      <nav
        className="fixed top-0 left-0 w-full bg-white border-b shadow-sm h-[70px] flex items-center justify-between px-12 z-50"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <Link to="/" className="flex items-center">
          <img src="/coala.jpg" alt="Coala Logo" className="w-10 h-10 mr-2 rounded-full border" />
          <span className="text-2xl font-semibold text-green-700">Coala</span>
        </Link>
  
        <div className="grid grid-cols-6 w-[900px] text-center">
          {menuItems.map((item, idx) => (
            <div key={idx} className="h-[50px] flex items-center justify-center">
              {item.label === "학습자료" ? (
                <span
                  onClick={async () => {
                    try {
                      const res = await fetch("http://localhost:8000/languages");
                      const languages = await res.json();
                      if (languages.length > 0) {
                        const lang = languages[0].language;
                        const mat = await fetch(`http://localhost:8000/api/materials/${lang}`, {
                          credentials: "include",
                        });
                        const list = await mat.json();
                        if (list.length > 0) {
                          navigate(`/StudyMaterialsPage?category=${lang}&id=${list[0].material_id}`);
                        }
                      }
                    } catch {
                      alert("오류 발생");
                    }
                  }}
                  className="cursor-pointer text-[17px] font-semibold text-gray-900 transition duration-200 hover:text-green-500 hover:scale-110 hover:font-bold"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="text-[17px] font-semibold text-gray-900 transition duration-200 hover:text-green-500 hover:scale-110 hover:font-bold"
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </div>
  
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-gray-700">{user.nickname}님</span>
              <button
                onClick={logoutAndRedirect}
                className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
              >
                로그인
              </Link>
              <Link
                to="/signup"
                className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </nav>
  
      {/* 드롭다운 메뉴 */}
      {hovering && (
        <div
          className="fixed top-[70px] left-0 w-full bg-white border-b shadow-md py-6 z-40"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          <div className="grid grid-cols-6 w-[900px] mx-auto transform -translate-x-[20px] gap-y-4">
            {menuItems.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-4 h-[200px]">
                {item.children.map((child, i) => (
                  <span
                    key={i}
                    className="text-[15px] font-medium text-gray-800 cursor-pointer transition duration-200 hover:text-green-500 hover:scale-105 hover:font-semibold"
                  >
                    {child}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
  
      <div className="h-[70px]" />
    </div>
  );
};

export default Navbar;