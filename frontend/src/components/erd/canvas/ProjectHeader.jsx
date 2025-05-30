import React, { useState } from "react";
import {
  Folder,
  Edit,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  FileUp,
  Blocks,
  History,
} from "lucide-react";


import EditErdNameModal from "../modal/EditErdNameModal";
import CodeConvertHeaderPanel from "../CodeConvertHeaderPanel";
import {
  commitErd,
  undoErdSnapshot,
  redoErdSnapshot,
  updateErdName,
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
  setTables,
  setRelations,
  showToast
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const handleUndo = async () => {
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
          participation_left: r.participation_left,
          relation_left: r.relation_left,
          relation_right: r.relation_right,
          participation_right: r.participation_right,
          relationType: `${r.participation_left}|${r.participation_right}`,
        }));

        setTables?.(parsedTables);
        setRelations?.(parsedRelations);
        showToast("🪄 마지막 상태로 되돌렸습니다.");
      }
    } catch (err) {
      console.error("Undo 실패:", err);
      showToast("📌 처음 상태입니다.");
    }
  };

  const handleRedo = async () => {
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
          participation_left: r.participation_left,
          relation_left: r.relation_left,
          relation_right: r.relation_right,
          participation_right: r.participation_right,
          relationType: `${r.participation_left}|${r.participation_right}`,
        }));

        setTables?.(parsedTables);
        setRelations?.(parsedRelations);
        showToast("🔁 다음 상태로 되돌렸습니다.");
      }
    } catch (err) {
      console.error("Redo 실패:", err);
      showToast("📌이미 최신 상태 입니다.");
    }
  };

  return (
    <>
      <div className="w-full bg-[#252836] text-white shadow-md border-b border-gray-700 py-4">
        {/* 💡 전체 헤더 컨테이너 */}
        <div className="max-w-7xl mx-auto px-4 flex flex-col gap-3">
          {/* 🔤 프로젝트 이름 + 수정 버튼 */}
          {mode !== "codegen" && (
            <div className="flex items-center justify-start gap-2">
              <h1 className="text-xl font-semibold">{projectName}</h1>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
              >
                <Edit size={16} className="text-blue-400" />
              </button>
            </div>
          )}

          {/* 🧱 버튼 영역 */}
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
                onClick={() => showToast("📦 내보내기 기능은 추후 구현 예정")}
                className="btn-header flex items-center gap-1"
              >
                <FileUp size={16} className="text-gray-400" />
                내보내기
              </button>
              <button
                onClick={() => setMode("codegen")}
                className="btn-header flex items-center gap-1"
              >
                <Blocks size={16} className="text-purple-400" />
                코드 변환
              </button>
              <button
                onClick={handleUndo}
                className="btn-header flex items-center gap-1"
              >
                <Undo2 size={16} className="text-orange-400" />
                Undo
              </button>
              <button
                onClick={handleRedo}
                className="btn-header flex items-center gap-1"
              >
                <Redo2 size={16} className="text-orange-400" />
                Redo
              </button>

              {/* 🔍 줌 */}
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

        {/* ✅ 이름 수정 모달 */}
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
      </div>
    </>
  );
};

export default ProjectHeader;
