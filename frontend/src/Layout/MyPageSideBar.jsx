// src/components/MyPageSidebar.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  UserCog,
  ListTodo,
  BarChart3,
  ChevronDown,
  ChevronRight,
  FileText,
} from "lucide-react";

const MyPageSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // 섹션/항목 정의
  const sections = useMemo(
    () => [
      {
        key: "account",
        title: "로그인 정보",
        icon: <UserCog className="w-4 h-4 text-sky-600" />,
        items: [
          { label: "계정 정보 및 관리", to: "/mypage/modify" },
          { label: "개인정보 보호 설정", to: "/mypage/setting" },
        ],
      },
      {
        key: "activity",
        title: "활동 내역",
        icon: <ListTodo className="w-4 h-4 text-green-600" />,
        items: [
          { label: "퀴즈 이력", to: "/mypage/quiz-history" },
          { label: "사용자 퀴즈 이력", to: "/mypage/userquiz-history" },
          { label: "코딩 테스트 이력", to: "/mypage/codingtest" },
          { label: "커뮤니티 활동 내역", to: "/mypage/community" },
        ],
      },
      {
        key: "records",
        title: "학습 성과 및 기록",
        icon: <BarChart3 className="w-4 h-4 text-yellow-600" />,
        items: [
          { label: "오답노트", to: "/mypage/wrong-notes" },
          { label: "출석체크", to: "/mypage/attendance" },
        ],
      },
      {
        key: "portfolio",
        title: "포트폴리오",
        icon: <FileText className="w-4 h-4 text-purple-600" />,
        items: [
          { label: "포트폴리오 추출", to: "/mypage/portfolio", exact: true },
          { label: "포트폴리오 추출 내역", to: "/mypage/portfolio/history", exact: true },
        ],
      },
    ],
    []
  );

  // 현재 경로가 속한 섹션 자동 펼침
  const sectionForPath = useMemo(() => {
    for (const s of sections) {
      if (s.items.some((i) => currentPath.startsWith(i.to))) return s.key;
    }
    return null;
  }, [sections, currentPath]);

  const [openSection, setOpenSection] = useState(sectionForPath);

  useEffect(() => {
    setOpenSection(sectionForPath);
  }, [sectionForPath]);

  const isActive = (item) => {
   const to = item.to;
   if (item.exact) return currentPath === to; // 정확히 일치할 때만 활성
   return currentPath === to || currentPath.startsWith(to + "/"); // 기존 동작 유지
 };

  const handleSectionToggle = (key) => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

  const handleItemClick = (to) => {
    if (currentPath !== to) navigate(to);
  };

  return (
    <aside
      className="absolute left-[70px] w-[260px] bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden z-40"
      style={{ top: "120px" }}
    >
      {/* 헤더 */}
      <div className="h-[56px] flex items-center px-6 bg-[#88C078] rounded-t-2xl shadow-sm">
        <h1 className="text-[18px] font-semibold text-black tracking-wide">
          마이페이지
        </h1>
      </div>

      {/* 섹션들 */}
      <div className="divide-y divide-gray-100">
        {sections.map((section) => {
          const isOpen = openSection === section.key;
          return (
            <div key={section.key}>
              {/* 섹션 헤더 */}
              <button
                type="button"
                onClick={() => handleSectionToggle(section.key)}
                className={`w-full px-6 py-4 flex items-center justify-between text-left cursor-pointer text-[16px] font-semibold transition-all duration-150 ${
                  isOpen
                    ? "bg-[#D9D9D9] text-gray-800"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <span className="flex items-center gap-2">
                  {section.icon}
                  {section.title}
                </span>
                {isOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {/* 섹션 항목 */}
              <div
                className={`transition-all duration-500 ease-in-out overflow-hidden origin-top ${
                  isOpen
                    ? "max-h-[600px] opacity-100 scale-y-100"
                    : "max-h-0 opacity-0 scale-y-95"
                }`}
                style={{ pointerEvents: isOpen ? "auto" : "none" }}
              >
                <ul className="py-2">
                  {section.items.map((item) => (
                    <li key={item.to}>
                      <div
                        onClick={() => handleItemClick(item.to)}
                        className={`mx-4 my-1 px-3 py-2 rounded-md text-[14px] cursor-pointer transition-all duration-150 ${isActive(item)
                            ? "bg-[#D9D9D9] text-gray-800 font-semibold"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {item.label}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default MyPageSidebar;
