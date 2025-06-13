import React, { useState, useEffect } from "react";
import ProjectCreateModal from "./ProjectCreateModal";
import { getMyProjects } from "../../api/projectApi";
import { LayoutDashboard, ListTodo, Inbox, Plus } from "lucide-react";

const ProjectSidebar = ({
  activeTab,
  setActiveTab,
  onProjectSelect,
  selectedProjectId,
  onUpdate,
  onNameChange,
}) => {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingProjectId, setViewingProjectId] = useState(null);

  const fetchProjects = async () => {
    try {
      const projectList = await getMyProjects();
      setProjects(projectList);
    } catch (err) {
      console.error("프로젝트 목록 가져오기 실패", err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleTabClick = (tabName) => {
    setViewingProjectId(null); // ← 프로젝트 강조 해제
    if (typeof setActiveTab === "function") {
      setActiveTab(tabName);
    }
  };

  const handleProjectClick = (projectId) => {
    onProjectSelect(projectId);
    setViewingProjectId(projectId); // ← 이게 강조 표시 기준이 됨
  };

  const handleProjectCreated = (newProject) => {
    setProjects((prev) => [...prev, newProject]);
    setIsModalOpen(false);
    if (newProject?.project_id) {
      onProjectSelect(newProject.project_id);
    }
    onUpdate();
  };

  return (
    <aside className="w-64 bg-white text-gray-800 flex flex-col px-4 py-6 border-r border-gray-200 shadow-sm">
      {/* 섹션: 작업 메뉴 */}
      <div className="space-y-3 text-sm mb-5">
        <div className="text-gray-500 uppercase tracking-wide mb-1">작업</div>
        {/* 대시보드 */}
        <div
          onClick={() => handleTabClick("dashboard")}
          className={`flex items-center gap-2 text-left px-2 py-1 rounded cursor-pointer transition
    ${
      activeTab === "dashboard"
        ? "bg-gray-200 font-medium text-black"
        : "text-gray-800 hover:text-black"
    }`}
        >
          <LayoutDashboard size={16} className="text-yellow-500" />
          <span>대시보드</span>
        </div>

        {/* 내 작업 */}
        <div
          onClick={() => handleTabClick("my-tasks")}
          className={`flex items-center gap-2 text-left px-2 py-1 rounded cursor-pointer transition
    ${
      activeTab === "my-tasks"
        ? "bg-gray-200 font-medium text-black"
        : "text-gray-800 hover:text-black"
    }`}
        >
          <ListTodo size={16} className="text-emerald-500" />
          <span>내 작업</span>
        </div>

        {/* 수신함 */}
        <div
          onClick={() => handleTabClick("inbox")}
          className={`flex items-center gap-2 text-left px-2 py-1 rounded cursor-pointer transition
    ${
      activeTab === "inbox"
        ? "bg-gray-200 font-medium text-black"
        : "text-gray-800 hover:text-black"
    }`}
        >
          <Inbox size={16} className="text-blue-500" />
          <span>수신함</span>
        </div>
      </div>

      <hr className="my-2 border-gray-300" />

      {/* 섹션: 프로젝트 목록 */}
      <div className="text-sm flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-gray-500 uppercase tracking-wide mb-2">
            <span>프로젝트</span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-gray-700 hover:text-blue-500"
              title="새 프로젝트 생성"
            >
              <Plus size={18} />
            </button>
          </div>

          {projects.length > 0 ? (
            <div className="space-y-1">
              {projects.map((project) => (
                <button
                  key={project.project_id}
                  onClick={() => handleProjectClick(project.project_id)}
                  className={`text-left block w-full px-2 py-1 rounded transition ${
                    viewingProjectId === project.project_id
                      ? "bg-gray-200 font-medium text-black"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {project.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">등록된 프로젝트 없음</p>
          )}
        </div>
      </div>

      {isModalOpen && (
        <ProjectCreateModal
          onClose={() => setIsModalOpen(false)}
          onCreated={handleProjectCreated}
        />
      )}
    </aside>
  );
};

export default ProjectSidebar;
