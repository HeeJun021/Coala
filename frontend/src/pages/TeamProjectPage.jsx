import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ProjectSidebar from "../components/project/ProjectSidebar";
import DashboardTab from "../components/project/DashboardTab";
import MyTasksTab from "../components/project/MyTasksTab";
import InboxTab from "../components/project/InboxTab";

const TeamProjectPage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  const projects = [
    { id: 1, name: "교차 기능팀 프로젝트", tasks: [1, 2] },
    { id: 2, name: "B 프로젝트", tasks: [3, 4] },
  ];

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const renderTabContent = () => {
    if (!selectedProject) {
      return <p className="text-gray-500">좌측에서 프로젝트를 선택하세요.</p>;
    }

    switch (activeTab) {
      case "dashboard":
        return <DashboardTab project={selectedProject} />;
      case "my-tasks":
        return <MyTasksTab project={selectedProject} />;
      case "inbox":
        return <InboxTab project={selectedProject} />;
      default:
        return <DashboardTab project={selectedProject} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8f6f3]">
      <ProjectSidebar
        projects={projects}
        setActiveTab={setActiveTab}
        onProjectSelect={setSelectedProjectId}
      />
      <main className="flex-1 p-10">{renderTabContent()}</main>
    </div>
  );
};

export default TeamProjectPage;
