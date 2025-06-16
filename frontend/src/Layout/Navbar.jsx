import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { initRootCodeFolder } from "../api/codeApi";
import { getLanguages } from "../api/languageApi";
import { fetchStudyMaterials } from "../api/studyMaterialsApi";

const Navbar = () => {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();
  const [hoverIndex, setHoverIndex] = useState(null);
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    const fetchLanguages = async () => {
      const langData = await getLanguages();
      setLanguages(langData);
    };
    fetchLanguages();
  }, []);

  const logoutAndRedirect = async () => {
    await handleLogout();
    navigate("/");
    window.location.reload();
  };

  const handleLanguageClick = async (language) => {
    try {
      const materials = await fetchStudyMaterials(language);
      if (materials.length > 0) {
        const firstMaterial = materials[0];
        navigate(
          `/StudyMaterialsPage?category=${encodeURIComponent(language)}&id=${firstMaterial.material_id}`
        );
      } else {
        alert("해당 언어의 학습자료가 없습니다.");
      }
    } catch (error) {
      console.error(`Error fetching materials for ${language}:`, error);
      alert("학습자료를 불러오는 중 오류가 발생했습니다.");
    }
  };

  const menuItems = [
    {
      label: "학습자료",
      path: "/StudyMaterialsPage",
      children: languages.map((lang) => lang.language),
    },
    {
      label: "퀴즈문제",
      path: "/quizpage",
      children: ["연습 퀴즈", "테스트 퀴즈", "퀴즈 만들기"],
    },
    {
      label: "자율코딩",
      path: "/self-coding",
      children: ["코드 에디터", "Github"],
    },
    {
      label: "코딩테스트",
      path: "/codingtest",
      children: ["문제 목록", "통계 및 제출 내역"],
    },
    {
      label: "프로젝트",
      path: "/team-project",
      children: ["대시보드", "내 작업"],
    },
    {
      label: "게시판",
      path: "/board",
      children: ["자유 게시판", "프로젝트 모집", "코드 게시판",],
    },
    {
      label: "마이페이지",
      path: user ? "/mypage/modify" : "/login",
      children: ["정보 변경", "내 학습 현황", "커뮤니티 이력"],
    },
  ];

  return (
    <div className="relative z-50" onMouseLeave={() => setHoverIndex(null)}>
      {/* 상단 네비게이션 바 */}
      <nav className="fixed top-0 left-0 w-full bg-white border-b shadow-sm h-[70px] flex items-center justify-between px-12 z-50">
        <Link to="/" className="flex items-center">
          <img
            src="/coala.jpg"
            alt="Coala Logo"
            className="w-10 h-10 mr-2 rounded-full border"
          />
          <span className="text-2xl font-semibold text-green-700">Coala</span>
        </Link>

        <div className="grid grid-cols-7 w-[1050px] pr-2 text-center">
          {menuItems.map((item, idx) => (
            <div
              key={idx}
              className="h-[50px] flex items-center justify-center relative"
              onMouseEnter={() => setHoverIndex(idx)}
            >
              {item.label === "학습자료" ? (
                <span
                  onClick={async () => {
                    try {
                      const materials = await fetchStudyMaterials(
                        languages[0]?.language
                      );
                      if (materials.length > 0) {
                        navigate(
                          `/StudyMaterialsPage?category=${encodeURIComponent(
                            languages[0]?.language
                          )}&id=${materials[0].material_id}`
                        );
                      }
                    } catch {
                      alert("오류 발생");
                    }
                  }}
                  className="cursor-pointer text-[17px] font-semibold text-gray-900 transition duration-200 hover:text-green-500 hover:scale-110 hover:font-bold"
                >
                  {item.label}
                </span>
              ) : item.label === "자율코딩" ? (
                <span
                  onClick={async () => {
                    try {
                      await initRootCodeFolder();
                      navigate(item.path);
                    } catch (err) {
                      console.error("폴더 생성 오류:", err);
                      alert("자율코딩 초기화 중 오류가 발생했습니다.");
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
      <div
        className={`fixed top-[70px] pr-6 left-0 w-full bg-white border-b shadow-md z-40 overflow-hidden transition-all duration-300 ${
          hoverIndex !== null
            ? "max-h-[250px] py-6 opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex justify-center">
          <div className="grid grid-cols-7 w-[1050px] text-center">
            {menuItems.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-3">
                {item.children.map((child, i) => {
                  if (item.label === "학습자료") {
                    return (
                      <span
                        key={i}
                        onClick={() => handleLanguageClick(child)}
                        className={`text-[15px] font-medium text-gray-800 cursor-pointer transition duration-200 hover:text-green-500 hover:scale-105 hover:font-semibold ${
                          hoverIndex === idx ? "" : "opacity-50"
                        }`}
                      >
                        {child}
                      </span>
                    );
                  }

                  if (item.label === "퀴즈문제") {
                    let link = "";
                    if (child === "연습 퀴즈") link = "/quizpage";
                    if (child === "테스트 퀴즈") link = "/quizpage?category=test";
                    if (child === "퀴즈 만들기") link = "/quizpage?category=user";
                    return (
                      <Link
                        key={i}
                        to={link}
                        className={`text-[15px] font-medium text-gray-800 cursor-pointer transition duration-200 hover:text-green-500 hover:scale-105 hover:font-semibold ${
                          hoverIndex === idx ? "" : "opacity-50"
                        }`}
                      >
                        {child}
                      </Link>
                    );
                  }


                  if (item.label === "자율코딩") {
                    if (child === "코드 에디터") {
                      return (
                        <span
                          key={i}
                          onClick={async () => {
                            try {
                              await initRootCodeFolder();
                              navigate("/self-coding", { state: { panel: "explorer" } });
                            } catch (err) {
                              alert("초기화 실패");
                            }
                          }}
                          className={`text-[15px] font-medium text-gray-800 cursor-pointer transition duration-200 hover:text-green-500 hover:scale-105 hover:font-semibold ${
                            hoverIndex === idx ? "" : "opacity-50"
                          }`}
                        >
                          {child}
                        </span>
                      );
                    }

                    if (child === "Github") {
                      return (
                        <span
                          key={i}
                          onClick={async () => {
                            try {
                              await initRootCodeFolder();
                              navigate("/self-coding", { state: { panel: "git" } });
                            } catch (err) {
                              alert("초기화 실패");
                            }
                          }}
                          className={`text-[15px] font-medium text-gray-800 cursor-pointer transition duration-200 hover:text-green-500 hover:scale-105 hover:font-semibold ${
                            hoverIndex === idx ? "" : "opacity-50"
                          }`}
                        >
                          {child}
                        </span>
                      );
                    }
                  }

                  if (item.label === "코딩테스트" && child === "문제 목록") {
                    return (
                      <Link
                        key={i}
                        to="/codingtest"
                        className={`text-[15px] font-medium text-gray-800 cursor-pointer transition duration-200 hover:text-green-500 hover:scale-105 hover:font-semibold ${
                          hoverIndex === idx ? "" : "opacity-50"
                        }`}
                      >
                        {child}
                      </Link>
                    );
                  }

                  if (
                    item.label === "코딩테스트" &&
                    child === "통계 및 제출 내역"
                  ) {
                    return (
                      <Link
                        key={i}
                        to="/my-submissions"
                        className={`text-[15px] font-medium text-gray-800 cursor-pointer transition duration-200 hover:text-green-500 hover:scale-105 hover:font-semibold ${
                          hoverIndex === idx ? "" : "opacity-50"
                        }`}
                      >
                        {child}
                      </Link>
                    );
                  }

                  if (item.label === "게시판") {
                    let link = "";
                    if (child === "자유 게시판") link = "/board/free";
                    if (child === "프로젝트 모집") link = "/board/project";
                    if (child === "코드 게시판") link = "/board/code";
                    if (link) {
                      return (
                        <Link
                          key={i}
                          to={link}
                          className={`text-[15px] font-medium text-gray-800 cursor-pointer transition duration-200 hover:text-green-500 hover:scale-105 hover:font-semibold ${
                            hoverIndex === idx ? "" : "opacity-50"
                          }`}
                        >
                          {child}
                        </Link>
                      );
                    }
                  }                  
                  
                  if (item.label === "프로젝트") {
                    let link = "/team-project";
                    let tab = "";
                    if (child === "대시보드") tab = "dashboard";
                    if (child === "내 작업") tab = "my-tasks";
                    return (
                      <span
                        key={i}
                        onClick={() => navigate(link, { state: { tab } })}
                        className={`text-[15px] font-medium text-gray-800 cursor-pointer transition duration-200 hover:text-green-500 hover:scale-105 hover:font-semibold ${
                          hoverIndex === idx ? "" : "opacity-50"
                        }`}
                      >
                        {child}
                      </span>
                    );
                  }

                  if (item.label === "마이페이지") {
                    let link = "";
                    if (child === "정보 변경") link = "/mypage/modify";
                    if (child === "내 학습 현황") link = "/mypage/quiz-history";
                    if (child === "커뮤니티 이력") link = "/mypage/community";
                    if (link) {
                      return (
                        <Link
                          key={i}
                          to={link}
                          className={`text-[15px] font-medium text-gray-800 cursor-pointer transition duration-200 hover:text-green-500 hover:scale-105 hover:font-semibold ${
                            hoverIndex === idx ? "" : "opacity-50"
                          }`}
                        >
                          {child}
                        </Link>
                      );
                    }
                  }

                  return (
                    <span
                      key={i}
                      className={`text-[15px] font-medium text-gray-800 cursor-default ${
                        hoverIndex === idx ? "" : "opacity-50"
                      }`}
                    >
                      {child}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
