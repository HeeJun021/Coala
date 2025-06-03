import React from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import FloatingButton from "../components/floating/FloatingButton";

const MainLayout = ({ children }) => {
  const location = useLocation();

  const isHome = location.pathname === "/";
  const showSidebar = location.pathname.startsWith("/StudyMaterialsPage") || 
                      location.pathname.startsWith("/materials/");
  const isTeamProject = location.pathname.startsWith("/team-project");

  return (
    <div className="layout flex h-screen">
      <Navbar />

      {showSidebar && (
        <Sidebar className="w-64 flex-shrink-0" />
      )}

      <main
        className={`content flex-1 min-h-screen ${isHome || isTeamProject ? "px-0" : "px-10 mx-auto"}`}
      >
        {children}
      </main>
      <FloatingButton />
    </div>
  );
};

export default MainLayout;