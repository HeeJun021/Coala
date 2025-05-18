import React, { useState } from "react";
import ProjectHeader from "../components/erd/ProjectHeader";
import ErdListSidebar from "../components/erd/ErdListSidebar";
import ErdCanvas from "../components/erd/ErdCanvas";
import CodeGeneratorPanel from "../components/erd/CodeGeneratorPanel";

const ErdPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [tempTable, setTempTable] = useState(null);
  const [tables, setTables] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mode, setMode] = useState("default");

  // ✅ 자동 생성된 SQL 쿼리 상태
  const [sqlQuery, setSqlQuery] = useState(
    "-- (자동 로딩 or 붙여넣기한 SQL 쿼리)"
  );
  const [language, setLanguage] = useState("Python");
  const [convertType, setConvertType] = useState("class");

  // 🔁 헤더에서 자동 가져오기 트리거 시
  const handleFetchAutoSql = () => {
    // 이후 실제 변환 로직으로 대체 가능
    const dummySql = `
-- Users 테이블
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(255) UNIQUE
);
    `.trim();
    setSqlQuery(dummySql);
  };

  return (
    <div className="w-full h-screen bg-[#1E1E2F] text-white flex flex-col overflow-hidden">
      {/* 상단 헤더 */}
      <div className="shrink-0">
        <ProjectHeader
          projectName="ERD 샘플 프로젝트"
          onEditName={() => {}}
          onOpenLog={() => {}}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          mode={mode}
          setMode={setMode}
          language={language}
          setLanguage={setLanguage}
          convertType={convertType}
          setConvertType={setConvertType}
          onFetch={handleFetchAutoSql} // ✅ 자동 쿼리 가져오기 함수 전달
        />
      </div>

      {/* 본문 */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* 좌측 사이드바 */}
        {isSidebarOpen && (
          <div className="w-64 shrink-0">
            <ErdListSidebar onClose={() => setIsSidebarOpen(false)} />
          </div>
        )}

        {/* 메인 콘텐츠 (ERD 캔버스 or 코드 생성기) */}
        <div className="flex-1 relative min-w-0 min-h-0">
          {mode === "default" ? (
            <ErdCanvas
              isPlacing={isPlacing}
              setIsPlacing={setIsPlacing}
              tempTable={tempTable}
              setTempTable={setTempTable}
              tables={tables}
              setTables={setTables}
              zoomLevel={zoomLevel}
            />
          ) : (
            <CodeGeneratorPanel sqlQuery={sqlQuery} setSqlQuery={setSqlQuery} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ErdPage;
