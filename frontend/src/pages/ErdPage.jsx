import React, { useEffect, useState } from "react";
import { getErdDetail } from "../api/erd/erdDetailApi"; // ✅ API 임포트
import { useParams } from "react-router-dom"; // ✅ 추가
import ProjectHeader from "../components/erd/canvas/ProjectHeader";
import ErdListSidebar from "../components/erd/canvas/ErdListSidebar";
import ErdCanvas from "../components/erd/canvas/ErdCanvas";
import CodeGeneratorPanel from "../components/erd/CodeGeneratorPanel";

const ErdPage = () => {
  const { erdId } = useParams(); // ✅ URL에서 erdId 추출
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [tempTable, setTempTable] = useState(null);
  const [tables, setTables] = useState([]);
  const [columns, setColumns] = useState([]); // ✅ 추가
  const [relations, setRelations] = useState([]); // ✅ 추가
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mode, setMode] = useState("default");

  const [sqlQuery, setSqlQuery] = useState(
    "-- (자동 로딩 or 붙여넣기한 SQL 쿼리)"
  );
  const [language, setLanguage] = useState("Python");
  const [convertType, setConvertType] = useState("class");

  // ✅ ERD 상세 조회
  useEffect(() => {
    const fetchErdDetail = async () => {
      try {
        const data = await getErdDetail(erdId); // ✅ 동적 erdId 사용

        // ✅ 테이블 데이터 매핑
        const parsedTables = (data.tables || []).map((t) => ({
          id: t.table_id, // ✅ 반드시 필요
          x: t.pos_x,
          y: t.pos_y,
          tableName: t.name,
          description: t.description || "",
          columns: t.columns || [],
        }));

        setTables(parsedTables);
        setColumns(data.columns || []); // 필요 없으면 생략 가능
        setRelations(data.relations || []);
      } catch (err) {
        console.error("ERD 상세 조회 실패:", err);
      }
    };

    fetchErdDetail();
  }, [erdId]);

  // 샘플 쿼리 자동 로딩
  const handleFetchAutoSql = () => {
    const dummySql = `
-- Users 테이블
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(255) UNIQUE
);`.trim();
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
          onFetch={handleFetchAutoSql}
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

        {/* 메인 콘텐츠 */}
        <div className="flex-1 relative min-w-0 min-h-0">
          {mode === "default" ? (
            <ErdCanvas
              isPlacing={isPlacing}
              setIsPlacing={setIsPlacing}
              tempTable={tempTable}
              setTempTable={setTempTable}
              tables={tables}
              setTables={setTables}
              columns={columns} // ✅ 전달
              relations={relations} // ✅ 전달
              zoomLevel={zoomLevel}
              erdId={parseInt(erdId)} // ✅ 전달
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
