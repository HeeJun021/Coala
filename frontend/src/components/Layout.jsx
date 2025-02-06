import React from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = ({ children }) => {
  const location = useLocation();

  // 특정 경로에서 버튼 숨김
  const hideButtons = location.pathname === "/signup" || location.pathname === "/login";

  return (
    <div className="layout flex flex-col min-h-screen bg-[#F8F3E2]">
      <Navbar hideButtons={hideButtons} />
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default Layout;
