import React, { useState, useEffect, useCallback } from "react";
import ProjectSidebar from "../../components/project/ProjectSidebar";
import DashboardTab from "../../components/project/DashboardTab";
import MyTasksTab from "../../components/project/MyTasksTab";
import InboxTab from "../../components/project/InboxTab";
import ProjectWidgetTabs from "../../components/project/ProjectWidgetTabs";
import ProjectCreateModal from "../../components/project/ProjectCreateModal";
import { getMyProjects } from "../../api/projectApi";
import { useLocation, useNavigate, useParams } from "react-router-dom";

/**
 * TeamProjectPage
 * - 네비바로 처음 들어오면 대시보드가 기본
 * - 프로젝트 미선택 상태에서도 '내 작업', '수신함'은 즉시 이동/렌더
 * - 'overview' / 'erd' / 'docs'만 프로젝트 선택을 요구
 */
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

  // 내 프로젝트 목록 로드
  const fetchProjects = useCallback(async () => {
    try {
      const projectList = await getMyProjects();
      setProjects(projectList || []);
      return projectList || [];
    } catch (err) {
      console.error("❌ 프로젝트 목록 가져오기 실패:", err);
      setProjects([]);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // 진입/라우팅 상태 반영
  useEffect(() => {
    // 기본 탭을 'dashboard'로 고정 (이전 'overview' → 변경)
    const tab = location.state?.tab || "dashboard";
    const sub = location.state?.subTab || null;
    const pid = location.state?.projectId || paramProjectId;

    setActiveTab(tab);
    setSubTab(sub);
    setSelectedProjectId(pid);
  }, [location.state, paramProjectId]);

  // 프로젝트 카드/사이드바에서 선택 시 라우팅
  const handleProjectSelect = (projectId) => {
    navigate(`/team-project/${projectId}`, {
      state: {
        tab: "overview",
        subTab: null,
        projectId: projectId,
      },
    });
  };

  // 프로젝트 생성 완료 시 처리
  const handleProjectCreated = async (newProject) => {
    setTempProject(newProject);
    const updatedList = await fetchProjects();
    setIsModalOpen(false);
    if (newProject?.project_id) {
      const exists = updatedList.some(
        (p) => p.project_id === newProject.project_id
      );
      if (exists) {
        handleProjectSelect(newProject.project_id);
      } else {
        console.warn("프로젝트 생성됨, 그러나 리스트에 없음");
      }
    }
  };

  // 탭 렌더링 로직
  const renderTabContent = () => {
    const normalizedSubTab = subTab === "document" ? "docs" : subTab;
    const normalizedTab = activeTab === "document" ? "docs" : activeTab;

    // 프로젝트가 필요한 탭만 정의
    const requiresProject = ["overview", "erd", "docs"];

    // 현재 선택 프로젝트 결정 (생성 직후 tempProject 우선)
    const selectedProject =
      tempProject ||
      projects.find((p) => String(p.project_id) === String(selectedProjectId));

    // 프로젝트 필요 탭인데 선택 프로젝트가 없을 때의 처리
    if (requiresProject.includes(normalizedTab) && !selectedProject) {
      // 아예 프로젝트가 없으면 안내 문구
      if (projects.length === 0 && !tempProject) {
        return (
          <div className="p-6 text-gray-500">
            참여 중인 프로젝트가 없습니다. 새 프로젝트를 생성해 주세요.
          </div>
        );
      }
      // 프로젝트가 있긴 하지만 선택되지 않았다면 대시보드로 대체
      return (
        <DashboardTab
          projects={projects}
          onProjectSelect={handleProjectSelect}
          setShowCreateProjectModal={setIsModalOpen}
        />
      );
    }

    // 프로젝트 필요 탭들
    if (requiresProject.includes(normalizedTab)) {
      return (
        <ProjectWidgetTabs
          key={`${selectedProject.project_id}-${normalizedSubTab || "overview"}`}
          project={selectedProject}
          onNameChange={() => fetchProjects()}
          defaultTab={normalizedSubTab || normalizedTab}
          currentUser={currentUser}
        />
      );
    }

    // 프로젝트가 필요 없는 탭들: 언제든 즉시 렌더 가능
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
        return <MyTasksTab projects={projects} />; // 프로젝트 없이도 동작
      case "inbox":
        return <InboxTab projects={projects} />; // 프로젝트 없이도 동작(내부 자급 로직 권장)
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
