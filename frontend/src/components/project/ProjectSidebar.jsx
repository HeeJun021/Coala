import React, { useState, useEffect } from "react";
import ProjectCreateModal from "./ProjectCreateModal";
import { getMyProjects } from "../../api/projectApi";
import {
  LayoutDashboard,
  ListTodo,
  Inbox,
  Plus,
} from "lucide-react";

const ProjectSidebar = ({ setActiveTab, onProjectSelect, selectedProjectId, onUpdate, onNameChange }) => {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    if (typeof setActiveTab === "function") {
      setActiveTab(tabName);
    }
  };

  const handleProjectClick = (projectId) => {
    onProjectSelect(projectId);
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
      <div className="space-y-3 text-sm mb-8">
        <div className="text-gray-500 uppercase tracking-wide mb-1">작업</div>
        <button
          onClick={() => handleTabClick("dashboard")}
          className="flex items-center gap-2 text-left text-gray-800 hover:text-black"
        >
          <LayoutDashboard size={16} className="text-yellow-500" />
          <span>대시보드</span>
        </button>
        <button
          onClick={() => handleTabClick("my-tasks")}
          className="flex items-center gap-2 text-left text-gray-800 hover:text-black"
        >
          <ListTodo size={16} className="text-emerald-500" />
          <span>내 작업</span>
        </button>
        <button
          onClick={() => handleTabClick("inbox")}
          className="flex items-center gap-2 text-left text-gray-800 hover:text-black"
        >
          <Inbox size={16} className="text-blue-500" />
          <span>수신함</span>
        </button>
      </div>

      <hr className="my-4 border-gray-300" />

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
                  className={`text-left block w-full px-2 py-1 rounded hover:bg-gray-100 ${
                    selectedProjectId === project.project_id
                      ? "text-blue-700 font-semibold underline bg-blue-50"
                      : "text-gray-700"
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

        {/* 하단: 명시적 + 생성 버튼 (보조용) */}
        <div className="mt-6">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            <span>프로젝트 생성</span>
          </button>
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
