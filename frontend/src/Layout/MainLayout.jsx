// components/Layout/MainLayout.jsx
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import FloatingButton from "../components/floating/FloatingButton";

const MainLayout = ({ children }) => {
  const { pathname } = useLocation();

  // 경로 바뀔 때 main 컨테이너 최상단으로
  useEffect(() => {
    const mainEl = document.getElementById("coala-main");
    mainEl?.scrollTo(0, 0);
  }, [pathname]);

  const showSidebar =
    pathname.startsWith("/StudyMaterialsPage") ||
    pathname.startsWith("/materials/");

  return (
    <div className="layout flex h-full"> {/* h-screen → h-full */}
      <Navbar />

      {showSidebar && <Sidebar className="w-64 flex-shrink-0" />}

      {/* id로 잡아서 스크롤 제어 */}
      <main
        id="coala-main"
        className="content flex-1 overflow-y-auto px-4"
      >
        {children}
      </main>

      <FloatingButton />
    </div>
  );
};

export default MainLayout;
