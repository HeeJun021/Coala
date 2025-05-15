import React, { useState } from "react";
import ProjectHeader from "../components/erd/ProjectHeader";
import ErdListSidebar from "../components/erd/ErdListSidebar";
import ErdCanvas from "../components/erd/ErdCanvas";
import FloatingToolButton from "../components/erd/FloatingToolButton";

const ErdPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false); // 커서 상태
  const [tempTable, setTempTable] = useState(null);  // 클릭 위치
  const [tables, setTables] = useState([]);          // 확정된 테이블 목록

  return (
    <div className="w-full h-screen bg-[#1E1E2F] text-white flex flex-col overflow-hidden">
      {/* 상단 헤더 */}
      <div className="shrink-0">
        <ProjectHeader
          projectName="ERD 샘플 프로젝트"
          onEditName={() => {}}
          onOpenLog={() => {}}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />
      </div>

      {/* 하단: 캔버스 전체 영역 */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* 좌측 사이드바 */}
        {isSidebarOpen && (
          <div className="w-64 shrink-0">
            <ErdListSidebar onClose={() => setIsSidebarOpen(false)} />
          </div>
        )}

        {/* 캔버스 */}
        <div className="flex-1 relative min-w-0 min-h-0">
          <ErdCanvas
            isPlacing={isPlacing}
            setIsPlacing={setIsPlacing}
            tempTable={tempTable}
            setTempTable={setTempTable}
            tables={tables}
            setTables={setTables}
          />
        </div>

        {/* 플로팅 툴 버튼 */}
        <FloatingToolButton
          onAddTable={() => {
            setIsPlacing(true);
            setTempTable(null);
          }}
        />
      </div>
    </div>
  );
};

export default ErdPage;
