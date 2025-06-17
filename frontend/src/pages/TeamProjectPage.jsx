import React, { useState, useEffect, useCallback } from "react";
import ProjectSidebar from "../components/project/ProjectSidebar";
import DashboardTab from "../components/project/DashboardTab";
import MyTasksTab from "../components/project/MyTasksTab";
import InboxTab from "../components/project/InboxTab";
import ProjectWidgetTabs from "../components/project/ProjectWidgetTabs";
import ProjectCreateModal from "../components/project/ProjectCreateModal";
import { getMyProjects } from "../api/projectApi";
import { useLocation, Outlet } from "react-router-dom";

const TeamProjectPage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || "dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const projectList = await getMyProjects();
      setProjects(projectList || []);
    } catch (err) {
      setProjects([]);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state?.tab]);

  const handleProjectSelect = (projectId) => {
    setSelectedProjectId(projectId);
    setActiveTab("overview");
  };

  const handleProjectCreated = async (newProject) => {
    await fetchProjects();
    setIsModalOpen(false);
    if (newProject?.project_id) {
      handleProjectSelect(newProject.project_id);
    }
  };

  const renderTabContent = () => {
    if (projects.length === 0) {
      return <div className="p-6 text-gray-500">참여 중인 프로젝트가 없습니다.</div>;
    }

    const selectedProject = projects.find(
      (p) => p.project_id === selectedProjectId
    );

    switch (activeTab) {
      case "overview":
        return (
          <ProjectWidgetTabs
            key={selectedProjectId}
            project={selectedProject}
          />
        );
      case "dashboard":
        return (
          <DashboardTab
            projects={projects}
            onProjectSelect={handleProjectSelect}
            setShowCreateProjectModal={setIsModalOpen}
          />
        );
      case "my-tasks":
        return <MyTasksTab projects={projects} />;
      case "inbox":
        return <InboxTab projects={projects} />;
      default:
        return (
          <div className="p-6 text-gray-400">
            지원되지 않는 탭입니다: {activeTab}
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <ProjectSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onProjectSelect={handleProjectSelect}
        selectedProjectId={selectedProjectId}
        onUpdate={fetchProjects}
      />
      <main className="flex-1">
        {renderTabContent()}
        {isModalOpen && (
          <ProjectCreateModal
            onClose={() => setIsModalOpen(false)}
            onCreated={handleProjectCreated}
          />
        )}
        <Outlet />
      </main>
    </div>
  );
};

export default TeamProjectPage;
