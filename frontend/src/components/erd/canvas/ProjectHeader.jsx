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
  language,
  setLanguage,
  convertType,
  setConvertType,
  onFetch,
  onRefresh,
}) => {
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2500); // 자동 사라짐 처리
  };

  const handleZoom = (direction) => {
    setZoomLevel((prev) =>
      direction === "in"
        ? Math.min(prev + 0.1, 2)
        : Math.max(prev - 0.1, 0.1)
    );
  };

  const handleCommit = async () => {
    try {
      await commitErd(erdId, {
        updated_tables: [],
        updated_columns: [],
        updated_relations: [],
      });
      showToast("📝 ERD 로그 기록 완료!");
    } catch (err) {
      console.error("로그 기록 실패:", err);
      showToast("❌ 로그 기록 중 오류 발생");
    }
  };

  const handleUndo = async () => {
    try {
      const res = await undoErdChange(erdId);
      if (res?.state_json) {
        onRefresh?.();
        onFetch?.(res.state_json);
        showToast("🪄 마지막 상태로 되돌렸습니다.");
      }
    } catch (err) {
      console.error("Undo 실패:", err);
      showToast("⛔ 되돌리기 실패");
    }
  };

  const handleRedo = async () => {
    try {
      const res = await redoErdChange(erdId);
      if (res?.state_json) {
        onRefresh?.();
        onFetch?.(res.state_json);
        showToast("🔁 다음 상태로 되돌렸습니다.");
      }
    } catch (err) {
      console.error("Redo 실패:", err);
      showToast("⛔ 다시 실행 실패");
    }
  };

  return (
    <div className="w-full bg-[#252836] text-white px-4 py-3 shadow-md relative">
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage("")} />}

      {/* 🔤 프로젝트 이름 */}
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

      {/* 🧱 모드에 따른 헤더 영역 */}
      {mode === "codegen" ? (
        <CodeConvertHeaderPanel
          onBack={() => setMode("default")}
          onFetch={onFetch}
          language={language}
          setLanguage={setLanguage}
          convertType={convertType}
          setConvertType={setConvertType}
        />
      ) : (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] pl-1">
          <button onClick={onOpenSidebar} className="px-3 py-1.5 hover:bg-[#333] rounded">
            📁 ERD 목록
          </button>
          <button onClick={handleCommit} className="px-3 py-1.5 hover:bg-[#333] rounded">
            📝 로그 기록
          </button>
          <button
            onClick={() => showToast("📦 내보내기 기능은 추후 구현 예정")}
            className="px-3 py-1.5 hover:bg-[#333] rounded"
          >
            📦 내보내기
          </button>
          <button onClick={() => setMode("codegen")} className="px-3 py-1.5 hover:bg-[#333] rounded">
            🧱 코드 변환
          </button>
          <button onClick={handleUndo} className="px-3 py-1.5 hover:bg-[#333] rounded">
            ↩️
          </button>
          <button onClick={handleRedo} className="px-3 py-1.5 hover:bg-[#333] rounded">
            ↪️
          </button>
          <div className="flex items-center gap-1 px-2">
            <button onClick={() => handleZoom("out")} className="px-2 py-1 rounded hover:bg-[#333]">
              🔍−
            </button>
            <span className="text-sm">{Math.round(zoomLevel * 100)}%</span>
            <button onClick={() => handleZoom("in")} className="px-2 py-1 rounded hover:bg-[#333]">
              🔍+
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectHeader;
