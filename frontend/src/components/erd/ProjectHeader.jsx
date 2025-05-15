import React from "react";

const ProjectHeader = ({ projectName, onEditName, onOpenLog, onOpenSidebar  }) => {
  return (
    <div className="w-full bg-[#252836] text-white px-4 py-3 shadow-md">
      {/* ✅ 줄 1: 프로젝트 이름 */}
      <div className="flex items-center space-x-2 text-[17px] font-semibold mb-2 pl-1">
        <span>{projectName}</span>
        <button
          onClick={onEditName}
          className="text-sm text-gray-400 hover:text-white"
        >
          ✏️ 수정
        </button>
      </div>

      {/* ✅ 줄 2: 툴바 버튼 */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] pl-1">
        <button
          onClick={onOpenSidebar}
          className="px-3 py-1.5 hover:bg-[#333] rounded"
        >
          📁 ERD 목록
        </button>

        <button className="px-3 py-1.5 hover:bg-[#333] rounded">💾 저장</button>
        <button
          onClick={onOpenLog}
          className="px-3 py-1.5 hover:bg-[#333] rounded"
        >
          📝 로그 기록
        </button>
        <button className="px-3 py-1.5 hover:bg-[#333] rounded">
          📦 내보내기
        </button>
        <button className="px-3 py-1.5 hover:bg-[#333] rounded">
          🧱 코드 변환
        </button>
        <button className="px-3 py-1.5">↩️</button>
        <button className="px-3 py-1.5">↪️</button>
        <div className="px-2">🔍− 🔍+ 100%</div>
      </div>
    </div>
  );
};

export default ProjectHeader;
