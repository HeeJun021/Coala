import React from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const MainLayout = ({ children }) => {
  const location = useLocation(); // 현재 페이지 URL 정보 가져오기

  // ✅ 특정 경로에서는 사이드바를 보여주도록 설정
  const showSidebar = location.pathname.startsWith("/StudyMaterialsPage");
//사이드바를 페이지별로 다르게 표시할 필요가 있다면? 
// const showSidebar = location.pathname.includes("StudyMaterialsPage") || location.pathname.includes("quiz");
// /quiz 페이지에서도 Sidebar를 보여주도록 변경 가능.
  return (
    <div className="layout flex">
      <Navbar /> {/* ✅ 네비게이션 바 (모든 페이지에서 공통으로 표시됨) */}

      {/* ✅ StudyMaterialsPage 관련 페이지에서만 사이드바 표시 */}
      {showSidebar && <Sidebar />}

      {/* ✅ 메인 컨텐츠 영역 (여기에 개별 페이지가 렌더링됨) */}
      <main className="content flex-1 px-10 max-w-[1207px] min-h-screen mx-auto">
        {children} {/* ✅ 개별 페이지의 내용이 들어가는 자리 */}
      </main>
    </div>
  );
};

export default MainLayout;
