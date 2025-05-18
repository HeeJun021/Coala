import React, { useState } from "react";
import DashboardTab from "../components/project/DashboardTab";
import MyTasksTab from "../components/project/MyTasksTab";
import InboxTab from "../components/project/InboxTab";
import ProjectSidebar from "../components/project/ProjectSidebar";

const TeamProjectDetailPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  // ✅ 전체 프로젝트 목록은 상위에서 보관
  const projects = [
    { id: 1, name: "교차 기능팀 프로젝트", tasks: [1, 2] },
    { id: 2, name: "프로젝트 B", tasks: [3, 4] },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab />;
      case "my-tasks":
        return <MyTasksTab />;
      case "inbox":
        return <InboxTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8f6f3]">
      {/* ✅ 실제 사이드바 컴포넌트로 대체 */}
      <ProjectSidebar projects={projects} setActiveTab={setActiveTab} />

      <main className="flex-1 p-10">{renderTabContent()}</main>
    </div>
  );
};

export default TeamProjectDetailPage;
