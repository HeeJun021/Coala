import React, { useRef, useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import ErdTableBox from "./ErdTableBox";
import FloatingToolButton from "./FloatingToolButton";
import ErdRelationLine from "./ErdRelationLine";

const ErdCanvas = ({ isPlacing, setIsPlacing, tables, setTables }) => {
  const canvasRef = useRef(null);

  // 🧩 관계 관련 상태
  const [relations, setRelations] = useState([]);
  const [isAddingRelation, setIsAddingRelation] = useState(false);
  const [selectedRelationType, setSelectedRelationType] = useState(null);
  const [pendingFromColumnId, setPendingFromColumnId] = useState(null);
  const [columnPositions, setColumnPositions] = useState({});

  // 🖱️ 테이블 추가
  const handleCanvasClick = (e) => {
    if (!isPlacing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newTable = {
      id: uuidv4(),
      x,
      y,
      tableName: "",
      description: "",
      columns: [],
    };

    setTables((prev) => [...prev, newTable]);
    setIsPlacing(false);
  };
  const handleColumnPositionUpdate = (tableId, colPosMap) => {
    setColumnPositions((prev) => ({
      ...prev,
      ...colPosMap,
    }));
  };

  // 🖍️ 테이블 수정
  const handleUpdateTable = useCallback(
    (updated) => {
      setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    },
    [setTables]
  );

  // 🗑️ 테이블 삭제
  const handleDeleteTable = useCallback(
    (id) => {
      setTables((prev) => prev.filter((t) => t.id !== id));
    },
    [setTables]
  );

  // 📌 컬럼 클릭 → 관계 생성 흐름 처리
  const handleColumnClick = (columnId) => {
    if (!isAddingRelation || !selectedRelationType) return;

    if (!pendingFromColumnId) {
      setPendingFromColumnId(columnId); // 출발점 설정
    } else {
      // 목적지까지 클릭했으면 관계 등록
      const newRelation = {
        relationId: uuidv4(),
        fromColumnId: pendingFromColumnId,
        toColumnId: columnId,
        relationType: selectedRelationType,
      };
      setRelations((prev) => [...prev, newRelation]);

      // 초기화
      setIsAddingRelation(false);
      setSelectedRelationType(null);
      setPendingFromColumnId(null);
    }
  };

  return (
    <div
      id="erd-canvas"
      ref={canvasRef}
      onClick={handleCanvasClick}
      className={`relative w-full h-full bg-[#1e1e2f] overflow-hidden ${
        isPlacing
          ? "cursor-crosshair"
          : isAddingRelation
          ? "cursor-crosshair"
          : "cursor-default"
      }`}
    >
      {/* 🔄 관계선 렌더링 */}
      {relations.map((rel) => {
        const from = columnPositions[rel.fromColumnId];
        const to = columnPositions[rel.toColumnId];



        return (
          <ErdRelationLine
            key={rel.relationId}
            fromColumn={from}
            toColumn={to}
            label={rel.relationType}
          />
        );
      })}

      {/* 테이블 박스들 */}
      {tables.map((table) => (
        <ErdTableBox
          key={table.id}
          {...table}
          onUpdate={handleUpdateTable}
          onDelete={() => handleDeleteTable(table.id)}
          isAddingRelation={isAddingRelation}
          selectedColumnId={pendingFromColumnId}
          onColumnClick={handleColumnClick}
          onColumnPositionUpdate={handleColumnPositionUpdate} // ⬅ 이 줄이 없음
        />
      ))}

      <FloatingToolButton
        onAddTable={() => setIsPlacing(true)}
        onAddRelation={(type) => {
          setIsAddingRelation(true);
          setSelectedRelationType(type);
          setPendingFromColumnId(null);
        }}
      />
    </div>
  );
};

export default ErdCanvas;
