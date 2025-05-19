import React, { useState, useEffect, useCallback } from "react";
import ProjectSidebar from "../components/project/ProjectSidebar";
import DashboardTab from "../components/project/DashboardTab";
import MyTasksTab from "../components/project/MyTasksTab";
import InboxTab from "../components/project/InboxTab";
import ProjectWidgetTabs from "../components/project/ProjectWidgetTabs";
import { getMyProjects } from "../api/projectApi";

const TeamProjectPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projects, setProjects] = useState([]);

  const fetchProjects = useCallback(async () => {
    try {
      const projectList = await getMyProjects();
      setProjects(projectList);
    } catch (err) {
      console.error("프로젝트 목록 가져오기 실패", err);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleProjectSelect = (projectId) => {
    setSelectedProjectId(projectId);
    setActiveTab("overview");
  };

  const renderTabContent = () => {
    const selectedProject = projects.find((p) => p.project_id === selectedProjectId);

    switch (activeTab) {
      case "overview":
        if (!selectedProject) {
          return <p className="text-gray-500">프로젝트를 선택하세요.</p>;
        }
        return <ProjectWidgetTabs key={selectedProjectId} project={selectedProject} />;
      case "dashboard":
        return <DashboardTab projects={projects} />;
      case "my-tasks":
        return <MyTasksTab projects={projects} />;
      case "inbox":
        return <InboxTab projects={projects} />;
      default:
        return <DashboardTab projects={projects} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8f6f3]">
      <ProjectSidebar
        setActiveTab={setActiveTab}
        onProjectSelect={handleProjectSelect}
        selectedProjectId={selectedProjectId}
        onUpdate={fetchProjects}
      />
      <main className="flex-1">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default TeamProjectPage;