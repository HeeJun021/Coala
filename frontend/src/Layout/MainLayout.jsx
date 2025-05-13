import React from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import FloatingButton from "../components/floating/FloatingButton"; // ✅ 플로팅 버튼 import

const MainLayout = ({ children }) => {
  const location = useLocation();

  const isHome = location.pathname === "/";

  const showSidebar =
    location.pathname.startsWith("/StudyMaterialsPage") ||
    location.pathname.startsWith("/materials/");

  return (
    <div className="layout flex">
      <Navbar />

      {showSidebar && <Sidebar />}

      {/* ✅ 메인 컨텐츠 영역 */}
      <main
        className={`content flex-1 min-h-screen w-full ${
          isHome ? "px-0" : "px-10 mx-auto"
        }`}
      >
        {children}
      </main>
      {/* ✅ 플로팅 버튼 항상 표시 */}
      <FloatingButton />
    </div>
  );
};

export default MainLayout;
