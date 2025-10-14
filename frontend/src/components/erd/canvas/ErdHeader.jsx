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
  // Blocks,
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
      showToast(
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-pink-600" />
          <span>ERD 히스토리 기록 완료!</span>
        </div>
      );
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
      alert("📓 테이블이 없습니다.");
      return;
    }
    
    const relationLineSvgs = Array.from(transformedRoot.children).filter(
      (child) => child.tagName.toLowerCase() === "svg"
    );

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

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

    const padding = 40;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const width = Math.ceil(maxX - minX);
    const height = Math.ceil(maxY - minY);

    const offscreen = document.createElement("div");
    offscreen.style.position = "fixed";
    offscreen.style.left = "-100000px";
    offscreen.style.top = "0";
    offscreen.style.width = width + "px";
    offscreen.style.height = height + "px";
    offscreen.style.background = "#ffffff";
    offscreen.style.overflow = "hidden"; // ✅ overflow: hidden 으로 변경
    offscreen.style.pointerEvents = "none";

    relationLineSvgs.forEach((svgEl) => {
      const clone = svgEl.cloneNode(true);
      clone.style.position = "absolute";
      clone.style.left = `0px`; // ✅ 컨테이너 자체는 0,0 에 위치
      clone.style.top = `0px`;  // ✅ 컨테이너 자체는 0,0 에 위치
      clone.style.transform = "none"; 

      // ✅ SVG 내부 모든 요소를 감싸는 <g> 태그 생성
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      
      // ✅ 계산된 오프셋만큼 그래픽 그룹 전체를 이동시킴
      group.setAttribute("transform", `translate(${-minX}, ${-minY})`);

      // ✅ 기존 자식들을 모두 새로운 <g> 태그로 이동
      while (clone.firstChild) {
        group.appendChild(clone.firstChild);
      }
      
      // ✅ 변환이 적용된 그룹을 SVG에 다시 추가
      clone.appendChild(group);
      
      offscreen.appendChild(clone);
    });

    tableEls.forEach((el) => {
      const clone = el.cloneNode(true);
      clone.style.position = "absolute";
      clone.style.left = (el.offsetLeft - minX) + "px";
      clone.style.top = (el.offsetTop - minY) + "px";
      clone.style.transform = "none";
      offscreen.appendChild(clone);
    });

    document.body.appendChild(offscreen);

    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const canvas = await html2canvas(offscreen, {
        backgroundColor: "#ffffff",
        useCORS: true,
        letterRendering: true,
        scale: Math.max(1.5, Math.min(3, window.devicePixelRatio || 2)),
        x: 0,
        y: 0,
        width,
        height,
        scrollX: 0,
        scrollY: 0,
        windowWidth: width,
        windowHeight: height,
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "erd_capture.png";
      link.click();
    } catch (err) {
      console.error("❌ 이미지 저장 오류:", err);
      alert("이미지 저장 중 오류가 발생했습니다.");
    } finally {
      offscreen.remove();
    }
  };


  return (
    <>
      <div className="relative w-full bg-gray-50 text-gray-900 shadow-sm py-4">
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
                  className="text-gray-700 hover:text-gray-900 flex items-center gap-1"
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
                  className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
                >
                  <Edit size={16} className="text-blue-600" />
                </button>
              </div>

              <div>
                <button
                  onClick={handleOpenGuide}
                  className="relative text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
                >
                  <HelpCircle size={18} className="text-gray-600" />
                  {showDot && (
                    <div
                      className="absolute top-0.5 -right-2.5 w-[8px] h-[8px] bg-rose-500 rounded-full shadow-md"
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
                className="btn-header flex items-center gap-1 text-gray-700 hover:bg-gray-200 rounded-md"
              >
                <Folder size={16} className="text-yellow-600" />
                목록
              </button>
              <button
                onClick={handleCommit}
                className="btn-header flex items-center gap-1 text-gray-700 hover:bg-gray-200 rounded-md"
              >
                <History size={16} className="text-pink-600" /> 히스토리 기록
              </button>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="btn-header flex items-center gap-1 text-gray-700 hover:bg-gray-200 rounded-md"
              >
                <FileUp size={16} className="text-gray-600" />
                SQL 내보내기
              </button>

              <button
                onClick={handleImageDownload}
                className="btn-header flex items-center gap-1 text-gray-700 hover:bg-gray-200 rounded-md"
              >
                <Camera size={16} className="text-green-600" />
                이미지 내보내기
              </button>

              {/* <button
                onClick={() => setMode("codegen")}
                className="btn-header flex items-center gap-1 text-gray-700 hover:bg-gray-200 rounded-md"
              >
                <Blocks size={16} className="text-purple-600" />
                코드 변환
              </button> 구현 x */}
              <button
                onClick={onUndo}
                className="btn-header flex items-center gap-1 text-gray-700 hover:bg-gray-200 rounded-md"
              >
                <Undo2 size={16} className="text-orange-600" />
                Undo
              </button>
              <button
                onClick={onRedo}
                className="btn-header flex items-center gap-1 text-gray-700 hover:bg-gray-200 rounded-md"
              >
                <Redo2 size={16} className="text-orange-600" />
                Redo
              </button>

              <div className="flex items-center gap-1 ml-4">
                <button
                  onClick={() => handleZoom("out")}
                  className="btn-header px-2"
                >
                  <ZoomOut size={16} className="text-red-600" />
                </button>
                <span className="w-[50px] text-center text-gray-700">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => handleZoom("in")}
                  className="btn-header px-2"
                >
                  <ZoomIn size={16} className="text-green-600" />
                </button>
              </div>
            </div>
          )}
        </div>
        {/* 헤더 하단 실선 */}
        <div className="absolute left-0 right-0 bottom-0 h-px bg-gray-300" />

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
