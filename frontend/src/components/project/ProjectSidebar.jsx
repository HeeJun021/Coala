import React from "react";
import { useNavigate } from "react-router-dom";

const ProjectSidebar = ({ projects = [], setActiveTab, onProjectSelect }) => {
  const handleTabClick = (tabName) => {
    if (typeof setActiveTab === "function") {
      setActiveTab(tabName);
    }
  };

  const handleProjectClick = (projectId) => {
    if (typeof onProjectSelect === "function") {
      onProjectSelect(projectId);
    }
  };

  return (
    <aside className="w-64 bg-[#1d1d1d] text-white flex flex-col px-4 py-6">
      <button
        onClick={() => alert("프로젝트 생성 예정")}
        className="bg-blue-600 text-white py-2 px-3 rounded mb-6 hover:bg-blue-700"
      >
        + 생성
      </button>

      <div className="space-y-3 text-sm">
        <div className="text-gray-400 uppercase tracking-wide mb-1">작업</div>
        <button onClick={() => handleTabClick("dashboard")} className="flex items-center gap-2 text-left text-white hover:underline">
          📋 <span>대시보드</span>
        </button>
        <button onClick={() => handleTabClick("my-tasks")} className="flex items-center gap-2 text-left text-white hover:underline">
          🗒️ <span>내 작업</span>
        </button>
        <button onClick={() => handleTabClick("inbox")} className="flex items-center gap-2 text-left text-white hover:underline">
          📥 <span>수신함</span>
        </button>
      </div>

      <hr className="my-6 border-gray-600" />

      <div className="text-sm">
        <div className="text-gray-400 uppercase tracking-wide mb-2">프로젝트</div>
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => handleProjectClick(project.id)}
            className="text-left text-gray-200 hover:text-white hover:underline block mb-1"
          >
            {project.name}
          </button>
        ))}
      </div>
    </aside>
  );
};

export default ProjectSidebar;
