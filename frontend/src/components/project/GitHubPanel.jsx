import React from "react";
import { GitBranch } from "lucide-react";

const GitHubPanel = ({ project }) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <GitBranch size={20} className="text-gray-700" />
        GitHub
      </h2>
      <div className="text-gray-600">
        <p className="text-sm">
          프로젝트: {project.name}
        </p>
        <p className="text-sm mt-2">
          GitHub 리포지토리 연결을 설정하려면 아래 버튼을 클릭하세요.
        </p>
        <button
          className="mt-4 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
          onClick={() => alert("GitHub 연동 기능은 준비 중입니다.")} // 임시 기능
        >
          GitHub 리포지토리 연결
        </button>
      </div>
    </div>
  );
};

export default GitHubPanel;