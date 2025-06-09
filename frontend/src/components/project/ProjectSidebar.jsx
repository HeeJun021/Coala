import React, { useState, useEffect } from "react";
import ProjectCreateModal from "./ProjectCreateModal";
import { getMyProjects } from "../../api/projectApi";

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
    <aside className="w-64 bg-[#1d1d1d] text-white flex flex-col px-4 py-6">
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-600 text-white py-2 px-3 rounded mb-6 hover:bg-blue-700"
      >
        + 생성
      </button>

      <div className="space-y-3 text-sm">
        <div className="text-gray-400 uppercase tracking-wide mb-1">작업</div>
        <button onClick={() => handleTabClick("dashboard")} className="flex items-center gap-2 text-left text-white hover:underline">
          🖥️ <span>대시보드</span>
        </button>
        <button onClick={() => handleTabClick("my-tasks")} className="flex items-center gap-2 text-left text-white hover:underline">
          📝 <span>내 작업</span>
        </button>
        <button onClick={() => handleTabClick("inbox")} className="flex items-center gap-2 text-left text-white hover:underline">
          📬 <span>수신함</span>
        </button>
      </div>

      <hr className="my-6 border-gray-600" />

      <div className="text-sm">
        <div className="flex items-center justify-between text-gray-400 uppercase tracking-wide mb-2">
          <span>프로젝트</span>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-white hover:text-blue-300 text-lg"
          >
            +
          </button>
        </div>
        {projects.map((project) => (
          <button
            key={project.project_id}
            onClick={() => handleProjectClick(project.project_id)}
            className={`text-left text-gray-200 hover:text-white hover:underline block mb-1 ${
              selectedProjectId === project.project_id ? "text-white underline" : ""
            }`}
          >
            {project.name}
          </button>
        ))}
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