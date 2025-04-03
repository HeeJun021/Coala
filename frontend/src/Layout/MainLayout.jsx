import React from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const MainLayout = ({ children }) => {
  const location = useLocation();

  const showSidebar = location.pathname.startsWith("/StudyMaterialsPage") || 
                      location.pathname.startsWith("/materials/");

  return (
    <div className="layout flex">
      <Navbar />

      {showSidebar && <Sidebar />}

      {/* ✅ 메인 컨텐츠 영역 */}
      <main className="content flex-1 px-10 min-h-screen mx-auto w-full">
        {children} {/* ✅ 개별 페이지의 내용이 들어가는 자리 */}
      </main>
    </div>
  );
};

export default MainLayout;
