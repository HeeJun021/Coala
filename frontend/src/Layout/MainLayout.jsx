// components/Layout/MainLayout.jsx
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import FloatingButton from "../components/floating/FloatingButton";

const MainLayout = ({ children }) => {
  const { pathname } = useLocation();

  const isTeamProject = pathname.startsWith("/team-project");
  const showSidebar =
    pathname.startsWith("/StudyMaterialsPage") ||
    pathname.startsWith("/materials/");

  // 경로 바뀔 때 스크롤 최상단
  useEffect(() => {
    if (isTeamProject) {
      // 팀 프로젝트는 예전처럼 뷰포트 스크롤
      window.scrollTo(0, 0);
    } else {
      // 그 외는 main 컨테이너 스크롤
      const mainEl = document.getElementById("coala-main");
      mainEl?.scrollTo(0, 0);
    }
  }, [pathname, isTeamProject]);

  return (
    <div className={`layout flex ${isTeamProject ? "min-h-screen" : "h-full"} overflow-x-hidden`}>
      <Navbar />

      {showSidebar && <Sidebar className="w-64 flex-shrink-0" />}

      {/* 팀 프로젝트: 예전 레이아웃(overflow 제거, px-0, min-h-screen)
          그 외: 현재 레이아웃(overflow-y-auto, px-4) */}
      <main
        id="coala-main"
        className={`content flex-1 ${
          isTeamProject
            ? "min-h-screen px-0 overflow-y-visible"
            : showSidebar
            ? "min-h-screen px-0"        // ✅ 내부 스크롤 OFF
            : "overflow-y-auto px-4"      // 그 외 페이지는 기존처럼 내부 스크롤
        }`}
      >
        {children}
      </main>

      <FloatingButton />
    </div>
  );
};

export default MainLayout;
