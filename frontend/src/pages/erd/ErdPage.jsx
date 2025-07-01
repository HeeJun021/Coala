import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  getErdDetail,
  undoErdSnapshot,
  redoErdSnapshot,
} from "../../api/erd/erdDetailApi";
import ErdHeader from "../../components/erd/canvas/ErdHeader";
import ErdListSidebar from "../../components/erd/canvas/ErdListSidebar";
import ErdCanvas from "../../components/erd/canvas/ErdCanvas";
import CodeGeneratorPanel from "../../components/erd/CodeGeneratorPanel";
import Toast from "../../components/Toast";

const ErdPage = () => {
  const { erdId } = useParams();

  const [projectId, setProjectId] = useState(null);

  // 상태: UI 관련
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [tempTable, setTempTable] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mode, setMode] = useState("default");

  // 상태: ERD 데이터
  const [tables, setTables] = useState([]);
  const [columns, setColumns] = useState([]);
  const [relations, setRelations] = useState([]);

  // 상태: 코드 변환기
  const [sqlQuery, setSqlQuery] = useState(
    "-- (자동 로딩 or 붙여넣기한 SQL 쿼리)"
  );
  const [language, setLanguage] = useState("Python");
  const [convertType, setConvertType] = useState("class");

  // ERD 이름 상태
  const [erdName, setErdName] = useState("");

  const [toastMessage, setToastMessage] = useState("");

  const showToast = useCallback((msg) => {
  setToastMessage(msg); // 시간 제어는 Toast 안에서
}, []);

  // ERD 상세 조회 함수
  const fetchErdDetail = useCallback(async () => {
    try {
      const data = await getErdDetail(erdId);

      setErdName(data.name ?? "이름 없음");
      setProjectId(data.project_id); 
      console.log("📦 ERD 상세 데이터", data);

      // 테이블 + 컬럼 구조 파싱
      const parsedTables = (data.tables || []).map((t) => ({
        id: t.table_id,
        x: t.pos_x,
        y: t.pos_y,
        tableName: t.name ?? "",
        description: t.description ?? "",
        columns: (t.columns || []).map((c) => ({
          ...c,
          id: c.column_id,
          name: c.name ?? "",
          dataType: c.data_type ?? "",
          isNullable: !c.is_not_null,
          isPrimaryKey: c.is_primary,
          isForeignKey: c.is_foreign, 
          defaultValue: c.default_value ?? "",
          comment: c.description ?? "",
        })),
      }));

      // 관계 파싱 (4개 속성 → relationType 조합)
      const parsedRelations = (data.relations || []).map((r) => ({
        relationId: r.relation_id,
        fromColumnId: r.source_column_id,
        toColumnId: r.target_column_id,
        participation_left: r.participation_source, // 좌측 참여도
        relation_left: "bar", // 왼쪽 기호 (항상 bar)
        relation_right: r.relation_type === "1:N" ? "crow" : "bar",
        participation_right: r.participation_target,
        relationType: `${r.relation_type}|${r.participation_source}|${r.participation_target}`, // UI에 필요 시
      }));

      // 상태 세팅
      setTables(parsedTables);
      setColumns(data.columns || []);
      setRelations(parsedRelations); // 관계 반영됨
    } catch (err) {
      console.error("ERD 상세 조회 실패:", err);
    }
  }, [erdId]);

  useEffect(() => {
    fetchErdDetail();
  }, [erdId, fetchErdDetail]); // erdId 추가

  const handleUndo = useCallback(async () => {
    try {
      const res = await undoErdSnapshot(erdId);
      if (res?.state_json) {
        const parsedTables = (res.state_json.tables || []).map((t) => ({
          id: t.table_id,
          x: t.pos_x,
          y: t.pos_y,
          tableName: t.name ?? "",
          description: t.description ?? "",
          columns: (t.columns || []).map((c) => ({
            ...c,
            id: c.column_id,
            name: c.name ?? "",
            dataType: c.data_type ?? "",
            isNullable: !c.is_not_null,
            isPrimaryKey: c.is_primary,
            isForeignKey: c.is_foreign,
            defaultValue: c.default_value ?? "",
            comment: c.description ?? "",
          })),
        }));

        const parsedRelations = (res.state_json.relations || []).map((r) => ({
          relationId: r.relation_id,
          fromColumnId: r.source_column_id,
          toColumnId: r.target_column_id,
          participation_left: r.participation_source,
          participation_right: r.participation_target,
          relation_left: "bar",
          relation_right: r.relation_type === "1:N" ? "crow" : "bar",
          relationType: `${r.relation_type}|${r.participation_source}|${r.participation_target}`,
        }));

        setTables?.(parsedTables);
        setRelations?.(parsedRelations);
        showToast("🪄 마지막 상태로 되돌렸습니다.");
      }
    } catch (err) {
      console.error("Undo 실패:", err);
      showToast("📌 처음 상태입니다.");
    }
  }, [erdId, setTables, setRelations, showToast]);

  const handleRedo = useCallback(async () => {
    try {
      const res = await redoErdSnapshot(erdId);
      if (res?.state_json) {
        const parsedTables = (res.state_json.tables || []).map((t) => ({
          id: t.table_id,
          x: t.pos_x,
          y: t.pos_y,
          tableName: t.name ?? "",
          description: t.description ?? "",
          columns: (t.columns || []).map((c) => ({
            ...c,
            id: c.column_id,
            name: c.name ?? "",
            dataType: c.data_type ?? "",
            isNullable: !c.is_not_null,
            isPrimaryKey: c.is_primary,
            isForeignKey: c.is_foreign,
            defaultValue: c.default_value ?? "",
            comment: c.description ?? "",
          })),
        }));

        const parsedRelations = (res.state_json.relations || []).map((r) => ({
          relationId: r.relation_id,
          fromColumnId: r.source_column_id,
          toColumnId: r.target_column_id,
          participation_left: r.participation_source,
          participation_right: r.participation_target,
          relation_left: "bar",
          relation_right: r.relation_type === "1:N" ? "crow" : "bar",
          relationType: `${r.relation_type}|${r.participation_source}|${r.participation_target}`,
        }));

        setTables?.(parsedTables);
        setRelations?.(parsedRelations);
        showToast("🔁 다음 상태로 되돌렸습니다.");
      }
    } catch (err) {
      console.error("Redo 실패:", err);
      showToast("📌이미 최신 상태 입니다.");
    }
  }, [erdId, setTables, setRelations, showToast]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      if (e.ctrlKey && e.shiftKey && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleUndo, handleRedo]);

  // 💡 샘플 SQL 쿼리 자동 삽입
  const handleFetchAutoSql = () => {
    setSqlQuery(`-- Users 테이블
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(255) UNIQUE
);`);
  };

  return (
    <>
      <div className="w-full h-screen bg-[#1E1E2F] text-white flex flex-col overflow-hidden">
        {/* 상단 헤더 */}
        <div className="shrink-0">
          <ErdHeader
            projectId={projectId}
            projectName={erdName}
            erdId={erdId}
            onEditName={(newName) => setErdName(newName)}
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
            onRefresh={fetchErdDetail}
            setTables={setTables}
            setRelations={setRelations}
            showToast={showToast}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />
        </div>

        {/* 본문 */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* 사이드바 */}
          {isSidebarOpen && (
            <ErdListSidebar onClose={() => setIsSidebarOpen(false)} />
          )}

          {/* 메인 영역 */}
          <div className="flex-1 relative min-w-0 min-h-0">
            {mode === "default" ? (
              <ErdCanvas
                erdId={parseInt(erdId)}
                isPlacing={isPlacing}
                setIsPlacing={setIsPlacing}
                tempTable={tempTable}
                setTempTable={setTempTable}
                tables={tables}
                setTables={setTables}
                columns={columns}
                relations={relations}
                setRelations={setRelations}
                zoomLevel={zoomLevel}
                setZoomLevel={setZoomLevel}
                fetchErdDetail={fetchErdDetail}
                showToast={showToast}
              />
            ) : (
              <CodeGeneratorPanel
                sqlQuery={sqlQuery}
                setSqlQuery={setSqlQuery}
              />
            )}
          </div>
        </div>
      </div>

      {/* Toast 메시지 최상단에 표시 (레이아웃 바깥에 위치) */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}
    </>
  );
};

export default ErdPage;
