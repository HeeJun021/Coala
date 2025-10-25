import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { initRootCodeFolder } from "../api/codeApi";
import { getLanguages } from "../api/languageApi";
import { fetchStudyMaterials } from "../api/studyMaterialsApi";
import { Leaf } from "lucide-react";

const Navbar = () => {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hoverIndex, setHoverIndex] = useState(null);
  const [languages, setLanguages] = useState([]);

  // 코딩테스트 강조 조건
  const isCodingTestActive =
    location.pathname.startsWith("/problem-explore") ||
    location.pathname.startsWith("/codingtest") ||
    location.pathname.startsWith("/my-submissions") ||
    location.pathname.startsWith("/my-stats");

  // 개념퀴즈 강조 조건
  const isQuizActive =
    location.pathname.startsWith("/quizpage") ||
    location.pathname.startsWith("/quiz-history") ||
    location.pathname.startsWith("/quiz-stats") ||
    location.pathname.startsWith("/quiz-review");

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

  const goSelfCoding = React.useCallback(
    async (panel /* 'explorer' | 'git' | undefined */) => {
      const seenKey = "selfcoding_first_seen";
      const firstVisit = !localStorage.getItem(seenKey);

      try {
        // 폴더 생성/초기화 호출은 항상 수행 (최초에도 반드시 호출)
        const res = await initRootCodeFolder();

        // 서버가 created 플래그를 주는 경우도 함께 사용(보조 판단)
        const createdFlag =
          Boolean(res?.created) ||
          Boolean(res?.is_created) ||
          res?.status === "created" ||
          res?.statusCode === 201 ||
          res?.wasCreated === true ||
          Boolean(res?.data?.created);

        // 최초 방문이거나(로컬 기준) 서버가 방금 생성했다고 하면 → 템플릿으로
        if (firstVisit || createdFlag) {
          localStorage.setItem(seenKey, "1");
          navigate("/self-coding/templates");
          return;
        }

        // 그 외에는 기존 페이지로 (패널 옵션 유지)
        if (panel === "git") {
          navigate("/self-coding", { state: { panel: "git" } });
        } else if (panel === "explorer") {
          navigate("/self-coding", { state: { panel: "explorer" } });
        } else {
          navigate("/self-coding");
        }
      } catch (err) {
        console.error("자율코딩 초기화 오류:", err);

        // ⚠️ 최초 방문인데 서버 오류가 나더라도 UX상 템플릿로 한번 보내줌
        if (firstVisit) {
          localStorage.setItem(seenKey, "1");
          navigate("/self-coding/templates");
          return;
        }

        alert("자율코딩 초기화 중 오류가 발생했습니다.");
      }
    },
    [navigate]
  );

  const handleLanguageClick = async (language) => {
    try {
      const materials = await fetchStudyMaterials(language);
      if (materials.length > 0) {
        const sortedMaterials = materials.sort((a, b) =>
          a.material_id === 2 ? -1 : b.material_id === 2 ? 1 : 0
        );
        const firstMaterial = sortedMaterials[0];
        navigate(
          `/StudyMaterialsPage?category=${encodeURIComponent(language)}&id=${
            firstMaterial.material_id
          }`
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
      children: languages.map((lang) => "\u00A0"+lang.language),
    },
    {
      label: "개념퀴즈",
      path: "/quizpage",
      children: [
        "연습 문제",
        "실전 문제",
        "오답 노트",
        "문제 만들기",
        "제출 내역",
        "퀴즈 통계",
      ],
    },
    {
      label: "자율코딩",
      path: "/self-coding",
      children: ["코드 에디터", "Github"],
    },
    {
      label: "코딩테스트",
      path: "/problem-explore", // 기본 클릭 시 "문제탐색"으로 이동
      children: ["문제 탐색", "문제 목록", "제출 내역", "코딩테스트 통계"],
    },

    {
      label: "프로젝트",
      path: "/team-project",
      children: ["대시보드", "내 작업", "프로젝트 생성"],
    },

    {
      label: "포트폴리오",
      path: user ? "/portfolio" : "/login",
      // ✅ "포트폴리오 추출", "포트폴리오 추출 내역" 뒤의 \u00A0 제거
      children: user ? ["포트폴리오 추출", "포트폴리오 추출 내역"] : [],
    },
    {
      label: "게시판",
      path: "/board",
      // ✅ "자유 게시판", "프로젝트 모집", "코드 공유 게시판" 뒤의 \u00A0 제거
      children: ["자유 게시판", "프로젝트 모집", "코드 공유 게시판"],
    },
  ];

  return (
    <div className="relative z-50" onMouseLeave={() => setHoverIndex(null)}>
      {/* 상단 네비게이션 바 */}
      <nav className="fixed top-0 left-0 w-full bg-white border-b shadow-sm h-[70px] flex items-center justify-between px-12 z-50">
        <Link to="/" className="flex items-center">
          <span className="relative text-3xl font-bold text-green-700 ml-10 after:content-[''] after:absolute after:left-0 after:bottom-[-2px] after:w-0 after:h-[3px] after:bg-green-600 after:transition-all after:duration-300 hover:after:w-full">
            {" "}
            {/* 👈 ml-8로 밀기 */}
            Coala
          </span>
        </Link>
        <div className="grid grid-cols-7 w-[1050px] pr-2 ml-16 text-center">
          {menuItems.map((item, idx) => (
            <div
              key={idx}
              className="h-[50px] flex items-center justify-center relative"
              onMouseEnter={() => setHoverIndex(idx)}
            >
              {item.label === "학습자료" ? (
                <span
                  onClick={() => navigate("/StudyMaterialsPage")}
                  className={`cursor-pointer text-[17px] font-semibold transition duration-200 hover:text-green-500 hover:scale-110 hover:font-bold ${
                    location.pathname.startsWith("/StudyMaterialsPage")
                      ? "text-green-600 font-bold"
                      : "text-gray-900"
                  }`}
                >
                  {item.label}
                </span>
              ) : item.label === "자율코딩" ? (
                <span
                  onClick={() => goSelfCoding()}
                  className={`cursor-pointer text-[17px] font-semibold transition duration-200 hover:text-green-500 hover:scale-110 hover:font-bold ${
                    location.pathname.startsWith("/self-coding")
                      ? "text-green-600 font-bold"
                      : "text-gray-900"
                  }`}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className={`text-[17px] font-semibold transition duration-200 hover:text-green-500 hover:scale-110 hover:font-bold ${
                    (item.label === "코딩테스트" && isCodingTestActive) ||
                    (item.label === "개념퀴즈" && isQuizActive) ||
                    location.pathname.startsWith(item.path)
                      ? "text-green-600 font-bold"
                      : "text-gray-900"
                  }`}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* 오른쪽 사용자 영역 */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* ✅ 유칼립투스 잎 먼저 */}
              <span className="flex items-center gap-1 text-sm text-green-700 font-semibold">
                <Leaf size={16} className="text-green-600" />
                {user.eucalyptus_balance ?? 0}
              </span>

              {/* ✅ 프로필 이미지 (닉네임 제거) */}
              <Link to="/mypage/modify">
                <img
                  src={user.profile_image_url || "/default-profile.png"}
                  alt="프로필"
                  className="w-9 h-9 rounded-full border object-cover cursor-pointer hover:scale-105 transition"
                />
              </Link>

              {/* 로그아웃 버튼 */}
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
        className={`fixed top-[70px] pr-6 left-[6px] w-full bg-white border-b shadow-md z-40 overflow-hidden transition-all duration-300 ${
          hoverIndex !== null
            ? "max-h-[250px] py-6 opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex justify-center">
          <div className="grid grid-cols-7 mr-1 w-[1050px] text-center">
            {menuItems.map((item, idx) => (
              <div
                key={idx}
                className={`flex flex-col gap-3 items-center ${
                  item.label === "게시판" || item.label === "포트폴리오" || item.label === "학습자료"
                    ? "pr-1 items-start"
                    : ""
                }`}
              >
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

                  if (item.label === "개념퀴즈") {
                    let link = "";
                    if (child === "연습 문제") link = "/quizpage";
                    if (child === "실전 문제") link = "/quizpage?category=test";
                    if (child === "문제 만들기")
                      link = "/quizpage?category=user";
                    if (child === "제출 내역")
                      link = "/quizpage?category=history";
                    if (child === "퀴즈 통계")
                      link = "/quizpage?category=stats";
                    if (child === "오답 노트")
                      link = "/quizpage?category=review";
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
                          onClick={() => goSelfCoding("explorer")} // ✅ 최초면 템플릿, 아니면 explorer 패널
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
                          onClick={() => goSelfCoding("git")} // 최초면 템플릿, 아니면 git 패널
                          className={`text-[15px] font-medium text-gray-800 cursor-pointer transition duration-200 hover:text-green-500 hover:scale-105 hover:font-semibold ${
                            hoverIndex === idx ? "" : "opacity-50"
                          }`}
                        >
                          {child}
                        </span>
                      );
                    }
                  }

                  // ⬇️ 아래 두 블록(문제 목록 / 통계 및 제출 내역) 지우고 이 블록 하나로 교체하세요.
                  if (item.label === "코딩테스트") {
                    let link = "";
                    if (child === "문제 탐색") link = "/problem-explore";
                    if (child === "문제 목록") link = "/codingtest";
                    if (child === "제출 내역") link = "/my-submissions";
                    if (child === "코딩테스트 통계") link = "/my-stats";

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

                  if (item.label === "프로젝트") {
                    let link = "/team-project";
                    let tab = "";
                    if (child === "대시보드") tab = "dashboard";
                    if (child === "내 작업") tab = "my-tasks";
                    if (child === "프로젝트 생성") {
                      return (
                        <span
                          key={i}
                          onClick={() =>
                            navigate(link, { state: { openCreateModal: true } })
                          }
                          className={`text-[15px] font-medium text-gray-800 cursor-pointer transition duration-200 hover:text-green-500 hover:scale-105 hover:font-semibold ${
                            hoverIndex === idx ? "" : "opacity-50"
                          }`}
                        >
                          {child}
                        </span>
                      );
                    }
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

                  if (item.label === "게시판") {
                    let link = "";
                    if (child === "자유 게시판") link = "/board/free";
                    if (child === "프로젝트 모집") link = "/board/project";
                    if (child === "코드 공유 게시판") link = "/board/code";
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

                  if (item.label === "포트폴리오") {
                    let link = "";
                    if (child === "포트폴리오 추출") link = "/portfolio";
                    if (child === "포트폴리오 추출 내역")
                      link = "/portfolio/history";

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

                  if (item.label === "마이페이지") {
                    let link = "";
                    if (child === "로그인 정보") link = "/mypage/modify";
                    if (child === "활동 내역") link = "/mypage/quiz-history";
                    if (child === "포트폴리오") link = "/mypage/portfolio";
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
