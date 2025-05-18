import React from "react";

const ProjectDetailPanel = ({ project }) => {
  return (
    <div className="bg-white rounded shadow p-6">
      <h2 className="text-2xl font-bold mb-4">📁 {project.name}</h2>
      <p className="mb-2 text-gray-600">설명: {project.description || "설명이 없습니다."}</p>
      <p className="text-sm text-gray-500">총 작업 수: {project.tasks?.length || 0}개</p>
    </div>
  );
};

export default ProjectDetailPanel;
