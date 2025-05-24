import React, { useState } from "react";
import Toast from "../../Toast";
import CodeConvertHeaderPanel from "../CodeConvertHeaderPanel";
import {
  commitErd,
  undoErdChange,
  redoErdChange,
} from "../../../api/erd/erdDetailApi";

const ProjectHeader = ({
  projectName,
  erdId,
  onEditName,
  onOpenSidebar,
  onOpenLog,
  zoomLevel,
  setZoomLevel,
  mode,
  setMode,
  language, // ✅ 외부 상태로부터 전달
  setLanguage, // ✅ 외부 상태로부터 전달
  convertType, // ✅ 외부 상태로부터 전달
  setConvertType, // ✅ 외부 상태로부터 전달
  onFetch, // ✅ 외부 상태로부터 전달
  onRefresh 
}) => {
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.1, 0.1));
  };

  const handleCommit = async () => {
    const dataToCommit = {
      updated_tables: [], // 실제 상태와 연동 필요
      updated_columns: [],
      updated_relations: [],
    };

    try {
      await commitErd(erdId, dataToCommit); // erdId 또는 projectId 맞게 교체
      showToast("📝 ERD 로그 기록 완료!");
    } catch (err) {
      console.error("로그 기록 실패:", err);
      showToast("❌ 로그 기록 중 오류 발생");
    }
  };

  const handleUndo = async () => {
    try {
      await undoErdChange(erdId);
      onRefresh?.();  // ✅ 진짜 상태 다시 불러오기
      showToast("🪄 마지막 작업을 되돌렸습니다.");
      onFetch?.(); // ✅ 여기서 다시 최신 상태 불러오기
    } catch (err) {
      console.error("Undo 실패:", err);
      showToast("⛔ 되돌리기 실패");
    }
  };

  const handleRedo = async () => {
    try {
      await redoErdChange(erdId);
      onRefresh?.();  // ✅ 진짜 상태 다시 불러오기
      showToast("🔁 마지막 작업을 다시 실행했습니다.");
      onFetch?.(); // ✅ 여기서도 다시 불러오기
    } catch (err) {
      console.error("Redo 실패:", err);
      showToast("⛔ 다시 실행 실패");
    }
  };

  return (
    <div className="w-full bg-[#252836] text-white px-4 py-3 shadow-md relative">
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}

      {/* ✅ 줄 1: 프로젝트 이름 (codegen 모드에서는 숨김) */}
      {mode !== "codegen" && (
        <div className="flex items-center space-x-2 text-[17px] font-semibold mb-2 pl-1">
          <span>{projectName}</span>
          <button
            onClick={onEditName}
            className="text-sm text-gray-400 hover:text-white"
          >
            ✏️ 수정
          </button>
        </div>
      )}

      {/* ✅ 줄 2: 모드에 따라 다른 헤더 렌더링 */}
      {mode === "codegen" ? (
        <CodeConvertHeaderPanel
          onBack={() => setMode("default")}
          onFetch={onFetch} // ✅ 꼭 넘겨야 함
          language={language} // ✅ 추가
          setLanguage={setLanguage} // ✅ 추가
          convertType={convertType} // ✅ 추가
          setConvertType={setConvertType} // ✅ 추가
        />
      ) : (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] pl-1">
          <button
            onClick={onOpenSidebar}
            className="px-3 py-1.5 hover:bg-[#333] rounded"
          >
            📁 ERD 목록
          </button>

          <button
            onClick={handleCommit}
            className="px-3 py-1.5 hover:bg-[#333] rounded"
          >
            📝 로그 기록
          </button>

          <button
            onClick={() => showToast("📦 내보내기 기능은 추후 구현 예정")}
            className="px-3 py-1.5 hover:bg-[#333] rounded"
          >
            📦 내보내기
          </button>

          <button
            onClick={() => setMode("codegen")}
            className="px-3 py-1.5 hover:bg-[#333] rounded"
          >
            🧱 코드 변환
          </button>

          <button
            onClick={handleUndo}
            className="px-3 py-1.5 hover:bg-[#333] rounded"
          >
            ↩️
          </button>

          <button
            onClick={handleRedo}
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
      )}
    </div>
  );
};

export default ProjectHeader;
