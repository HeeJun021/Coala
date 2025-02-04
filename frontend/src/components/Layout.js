import React from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  const location = useLocation();

  // 사이드바를 보여줄 경로 설정
  const showSidebar = location.pathname.startsWith("/StudyMaterialsPage");

  return (
    <div className="layout flex">
      <Navbar />
      {/* 조건부 렌더링으로 사이드바 표시 */}
      {showSidebar && <Sidebar />}
      {/* 메인 컨텐츠 */}
      <main
        className={`content ${
          showSidebar ? "ml-[250px]" : ""
        } flex-1 p-4 transition-all duration-300`}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;
