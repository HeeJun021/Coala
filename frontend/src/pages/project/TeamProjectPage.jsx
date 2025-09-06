import React, { useState, useEffect, useCallback } from "react";
import ProjectSidebar from "../../components/project/ProjectSidebar";
import DashboardTab from "../../components/project/DashboardTab";
import MyTasksTab from "../../components/project/MyTasksTab";
import InboxTab from "../../components/project/InboxTab";
import ProjectWidgetTabs from "../../components/project/ProjectWidgetTabs";
import ProjectCreateModal from "../../components/project/ProjectCreateModal";
import { getMyProjects } from "../../api/projectApi";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const TeamProjectPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId: paramProjectId } = useParams();

  // ▼▼▼ [수정] 실제 앱에서는 useAuth() 같은 훅이나 전역 상태(Recoil, Zustand 등)로 currentUser를 가져와야 해 ▼▼▼
  // 지금은 테스트를 위해 임시로 객체를 만들어 둘게.
  const [currentUser, setCurrentUser] = useState({
    user_id: 1,
    username: "testuser",
    provider: "github", // 이 값이 'github'이어야 GitHub 대시보드가 보여!
  });
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [subTab, setSubTab] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempProject, setTempProject] = useState(null);

  const fetchProjects = useCallback(async () => {
    try {
      const projectList = await getMyProjects();
      setProjects(projectList || []);
      return projectList;
    } catch (err) {
      console.error("❌ 프로젝트 목록 가져오기 실패:", err);
      setProjects([]);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const tab = location.state?.tab || "overview";
    const sub = location.state?.subTab || null;
    const pid = location.state?.projectId || paramProjectId;

    setActiveTab(tab);
    setSubTab(sub);
    setSelectedProjectId(pid);
  }, [location.state, paramProjectId]);

  const handleProjectSelect = (projectId) => {
    navigate(`/team-project/${projectId}`, {
      state: {
        tab: "overview",
        subTab: null,
        projectId: projectId,
      },
    });
  };

  const handleProjectCreated = async (newProject) => {
    setTempProject(newProject);
    const updatedList = await fetchProjects();
    setIsModalOpen(false);
    if (newProject?.project_id) {
      const exists = updatedList.some(p => p.project_id === newProject.project_id);
      if (exists) {
        handleProjectSelect(newProject.project_id);
      } else {
        console.warn("프로젝트 생성됨, 그러나 리스트에 없음");
      }
    }
  };

  const renderTabContent = () => {
    if (projects.length === 0 && !tempProject) {
      return <div className="p-6 text-gray-500">참여 중인 프로젝트가 없습니다.</div>;
    }

    const selectedProject = tempProject || projects.find(
      (p) => String(p.project_id) === String(selectedProjectId)
    );

    const normalizedSubTab = subTab === "document" ? "docs" : subTab;
    const normalizedTab = activeTab === "document" ? "docs" : activeTab;

    if (!selectedProject) {
      return (
        <DashboardTab
          projects={projects}
          onProjectSelect={handleProjectSelect}
          setShowCreateProjectModal={setIsModalOpen}
        />
      );
    }

    switch (normalizedTab) {
      case "overview":
      case "erd":
      case "docs":
        return (
          <ProjectWidgetTabs
            key={`${selectedProject.project_id}-${normalizedSubTab || "overview"}`}
            project={selectedProject}
            onNameChange={() => fetchProjects()}
            defaultTab={normalizedSubTab || normalizedTab}
            // ▼▼▼ [핵심 수정] currentUser를 props로 전달! ▼▼▼
            currentUser={currentUser}
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
      </main>
    </div>
  );
};

export default TeamProjectPage;
