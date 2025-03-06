import React from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import MyPageSideBar from "./MyPageSideBar";

const MainLayout = ({ children }) => {
  const location = useLocation(); // 현재 페이지 URL 정보 가져오기

  // ✅ StudyMaterialsPage 및 상세페이지에서 Sidebar 표시
  const showSidebar = location.pathname.startsWith("/StudyMaterialsPage") || 
                      location.pathname.startsWith("/materials/");
              
  const showMyPageSideBar = location.pathname.startsWith("/MyPage") || 
                            location.pathname.startsWith("/MyPageModify") || 
                            location.pathname.startsWith("/MyPageSetting/");


  return (
    <div className="layout flex">
      <Navbar /> {/* ✅ 네비게이션 바 (모든 페이지에서 공통으로 표시됨) */}

      {/* ✅ StudyMaterialsPage 및 상세 페이지에서 사이드바 표시 */}
      {showSidebar && <Sidebar />}

      {showMyPageSideBar && <MyPageSideBar />}
    

      {/* ✅ 메인 컨텐츠 영역 */}
      <main className="content flex-1 px-10 max-w-[1207px] min-h-screen mx-auto">
        {children} {/* ✅ 개별 페이지의 내용이 들어가는 자리 */}
      </main>
    </div>
  );
};

export default MainLayout;
