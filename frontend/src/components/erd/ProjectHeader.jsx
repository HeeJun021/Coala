import React, { useState } from "react";
import Toast from "../Toast"; // Toast 컴포넌트는 이미 구현된 것으로 가정

const ProjectHeader = ({
  projectName,
  onEditName,
  onOpenSidebar,
  onOpenLog,
  zoomLevel,
  setZoomLevel,
}) => {
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.1, 2)); // 최대 200%
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.1, 0.1)); // 최소 10%
  };

  return (
    <div className="w-full bg-[#252836] text-white px-4 py-3 shadow-md relative">
      {/* ✅ Toast 표시 */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}

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

        <button
          onClick={() => showToast("💾 ERD 저장 완료!")}
          className="px-3 py-1.5 hover:bg-[#333] rounded"
        >
          💾 저장
        </button>

        <button
          onClick={() => showToast("📝 ERD 로그 기록 완료!")}
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

        <button
          onClick={() => showToast("⏪ 실행 취소는 추후 구현 예정")}
          className="px-3 py-1.5 hover:bg-[#333] rounded"
        >
          ↩️
        </button>
        <button
          onClick={() => showToast("⏩ 다시 실행은 추후 구현 예정")}
          className="px-3 py-1.5 hover:bg-[#333] rounded"
        >
          ↪️
        </button>

        <div className="flex items-center gap-1 px-2">
          <button
            onClick={handleZoomOut}
            className="px-2 py-1 rounded hover:bg-[#333]"
          >
            🔍−
          </button>
          <span className="text-sm">{Math.round(zoomLevel * 100)}%</span>

          <button
            onClick={handleZoomIn}
            className="px-2 py-1 rounded hover:bg-[#333]"
          >
            🔍+
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;
