import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import {
  Camera,
  Folder,
  Edit,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  FileUp,
  Blocks,
  History,
  HelpCircle,
} from "lucide-react";
import ErdGuideModal from "../modal/ErdGuideModal";
import ExportSqlModal from "../modal/ExportSqlModal";
import EditErdNameModal from "../modal/EditErdNameModal";
import CodeConvertHeaderPanel from "../CodeConvertHeaderPanel";
import { commitErd, updateErdName } from "../../../api/erd/erdDetailApi";

const ErdHeader = ({
  projectId,
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
  setTables,
  setRelations,
  showToast,
  onUndo,
  onRedo,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [showDot, setShowDot] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const seen = localStorage.getItem("erd_guide_seen");
    setShowDot(seen !== "true");
  }, []);

  const handleOpenGuide = () => {
    setIsGuideOpen(true);
    setShowDot(false);
    localStorage.setItem("erd_guide_seen", "true");
  };

  const handleZoom = (direction) => {
    setZoomLevel((prev) =>
      direction === "in" ? Math.min(prev + 0.1, 2) : Math.max(prev - 0.1, 0.1)
    );
  };

  const handleCommit = async () => {
    try {
      await commitErd(erdId, {
        updated_tables: [],
        updated_columns: [],
        updated_relations: [],
      });
      showToast("📝 ERD 히스토리 기록 완료!");
    } catch (err) {
      console.error("히스토리 기록 실패:", err);
      showToast("❌ 히스토리 기록 중 오류 발생");
    }
  };

  const handleImageDownload = async () => {
    const canvasElement = document.getElementById("erd-canvas");
    if (!canvasElement) {
      alert("❌ 캔버스를 찾을 수 없습니다.");
      return;
    }

    const transformedRoot = canvasElement.querySelector(".origin-top-left");
    if (!transformedRoot) {
      alert("❌ 캡처 대상이 없습니다.");
      return;
    }

    const tableEls = transformedRoot.querySelectorAll(".erd-table-box");
    if (!tableEls.length) {
      alert("📭 테이블이 없습니다.");
      return;
    }

    const originalTransform = transformedRoot.style.transform;
    transformedRoot.style.transform = "none";

    const zoom = parseFloat(
      originalTransform.match(/scale\((.*?)\)/)?.[1] || "1"
    );

    const adjustedTables = [];
    tableEls.forEach((el) => {
      const x = parseFloat(el.style.left || "0");
      const y = parseFloat(el.style.top || "0");

      adjustedTables.push({
        el,
        originalLeft: el.style.left,
        originalTop: el.style.top,
      });

      el.style.left = `${x * zoom}px`;
      el.style.top = `${y * zoom}px`;
    });

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    tableEls.forEach((el) => {
      const x = el.offsetLeft;
      const y = el.offsetTop;
      const w = el.offsetWidth;
      const h = el.offsetHeight;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    });

    const width = maxX - minX;
    const height = maxY - minY;

    try {
      const canvas = await html2canvas(transformedRoot, {
        backgroundColor: null,
        useCORS: true,
        scale: 2,
        x: minX,
        y: minY,
        width,
        height,
        scrollX: 0,
        scrollY: 0,
        windowWidth: transformedRoot.scrollWidth,
        windowHeight: transformedRoot.scrollHeight,
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "erd_capture.png";
      link.click();
    } catch (err) {
      console.error("❌ 이미지 저장 오류:", err);
      alert("이미지 저장 중 오류가 발생했습니다.");
    } finally {
      transformedRoot.style.transform = originalTransform;
      adjustedTables.forEach(({ el, originalLeft, originalTop }) => {
        el.style.left = originalLeft;
        el.style.top = originalTop;
      });
    }
  };

  return (
    <>
      <div className="w-full bg-[#252836] text-white shadow-md border-b border-gray-700 py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col gap-3">
          {mode !== "codegen" && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    navigate(`/team-project/${projectId}`, {
                      state: { tab: "overview", subTab: "erd", projectId }, // 수정: subTab과 projectId 추가
                    })
                  }
                  className="text-white hover:text-gray-300 flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                <h1 className="text-xl font-semibold">{projectName}</h1>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                >
                  <Edit size={16} className="text-blue-400" />
                </button>
              </div>

              <div>
                <button
                  onClick={handleOpenGuide}
                  className="relative text-sm text-gray-400 hover:text-white flex items-center gap-1"
                >
                  <HelpCircle size={18} className="text-gray-300" />
                  {showDot && (
                    <div
                      className="absolute top-0.5 -right-2.5 w-[8px] h-[8px] bg-rose-600 rounded-full shadow-md"
                      style={{ transform: "translateY(-50%)" }}
                    />
                  )}
                </button>
              </div>
            </div>
          )}

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
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <button
                onClick={onOpenSidebar}
                className="btn-header flex items-center gap-1"
              >
                <Folder size={16} className="text-yellow-400" />
                목록
              </button>
              <button
                onClick={handleCommit}
                className="btn-header flex items-center gap-1"
              >
                <History size={16} className="text-pink-400" /> 히스토리 기록
              </button>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="btn-header flex items-center gap-1"
              >
                <FileUp size={16} className="text-gray-400" />
                SQL 내보내기
              </button>

              <button
                onClick={handleImageDownload}
                className="btn-header flex items-center gap-1"
              >
                <Camera size={16} className="text-green-400" />
                이미지 내보내기
              </button>

              <button
                onClick={() => setMode("codegen")}
                className="btn-header flex items-center gap-1"
              >
                <Blocks size={16} className="text-purple-400" />
                코드 변환
              </button>
              <button
                onClick={onUndo}
                className="btn-header flex items-center gap-1"
              >
                <Undo2 size={16} className="text-orange-400" />
                Undo
              </button>
              <button
                onClick={onRedo}
                className="btn-header flex items-center gap-1"
              >
                <Redo2 size={16} className="text-orange-400" />
                Redo
              </button>

              <div className="flex items-center gap-1 ml-4">
                <button
                  onClick={() => handleZoom("out")}
                  className="btn-header px-2"
                >
                  <ZoomOut size={16} className="text-red-400" />
                </button>
                <span className="w-[50px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => handleZoom("in")}
                  className="btn-header px-2"
                >
                  <ZoomIn size={16} className="text-green-400" />
                </button>
              </div>
            </div>
          )}
        </div>

        {isEditModalOpen && (
          <EditErdNameModal
            initialName={projectName}
            onClose={() => setIsEditModalOpen(false)}
            onSubmit={async (newName) => {
              try {
                await updateErdName(erdId, newName);
                onEditName?.(newName);
                showToast("✅ 이름이 변경되었습니다!");
                setIsEditModalOpen(false);
              } catch (err) {
                console.error("이름 변경 실패:", err);
                showToast("❌ 이름 변경 중 오류 발생");
              }
            }}
          />
        )}
        {isExportModalOpen && (
          <ExportSqlModal
            erdId={erdId}
            onClose={() => setIsExportModalOpen(false)}
            erdCanvasId="erd-canvas"
          />
        )}
        {isGuideOpen && (
          <ErdGuideModal
            isOpen={isGuideOpen}
            onClose={() => setIsGuideOpen(false)}
          />
        )}
      </div>
    </>
  );
};

export default ErdHeader;