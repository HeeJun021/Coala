// src/components/erd/ErdCanvas.jsx
import React, { useRef, useState } from "react";
import { useCallback } from "react"; // 상단에 추가
import { v4 as uuidv4 } from "uuid";
import ErdTableBox from "./ErdTableBox";
import ErdRelationLine from "./ErdRelationLine";
import FloatingToolButton from "./FloatingToolButton";

const ErdCanvas = ({ isPlacing, setIsPlacing, tables, setTables }) => {
  const canvasRef = useRef(null);
  const [relations, setRelations] = useState([]);
  const [isAddingRelation, setIsAddingRelation] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState(null);

  const [relationParticipation, setRelationParticipation] = useState("1|1..*"); // 기본값 설정 가능

  const columnPositionsRef = useRef({});

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

  const handleUpdateTable = (updatedTable) => {
    setTables((prev) =>
      prev.map((t) => (t.id === updatedTable.id ? updatedTable : t))
    );
  };

  const handleDeleteTable = (id) => {
    setTables((prev) => prev.filter((t) => t.id !== id));
    setRelations((prev) =>
      prev.filter((rel) => !rel.from.startsWith(id) && !rel.to.startsWith(id))
    );
  };

  const handleColumnPositionUpdate = useCallback((tableId, columnPosMap) => {
    const flattened = Object.fromEntries(
      Object.entries(columnPosMap).map(([colName, pos]) => [
        `${tableId}.${colName}`,
        pos,
      ])
    );
    columnPositionsRef.current = {
      ...columnPositionsRef.current,
      ...flattened,
    };
  }, []);

  const handleColumnClick = (tableId, columnName) => {
    if (!isAddingRelation) return;

    const columnId = `${tableId}.${columnName}`;
    if (!selectedColumnId) {
      setSelectedColumnId(columnId);
    } else if (selectedColumnId !== columnId) {
      setRelations((prev) => [
        ...prev,
        {
          from: selectedColumnId,
          to: columnId,
          type: relationParticipation, // ✅ 여기 수정
          label: "관계",
        },
      ]);
      setSelectedColumnId(null);
      setIsAddingRelation(false);
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
          ? "cursor-cell"
          : "cursor-default"
      }`}
    >
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,7 L10,3.5 z" fill="#f472b6" />
          </marker>
        </defs>

        {relations.map((rel, idx) => (
          <ErdRelationLine
            key={idx}
            from={rel.from}
            to={rel.to}
            type={rel.type}
            label={rel.label}
            columnPositions={columnPositionsRef.current}
          />
        ))}
      </svg>

      {tables.map((table) => (
        <ErdTableBox
          key={table.id}
          {...table}
          onUpdate={handleUpdateTable}
          onDelete={() => handleDeleteTable(table.id)}
          onColumnPositionUpdate={handleColumnPositionUpdate}
          onColumnClick={handleColumnClick}
          isAddingRelation={isAddingRelation}
          selectedColumnId={selectedColumnId}
        />
      ))}

      <FloatingToolButton
        onAddTable={() => setIsPlacing(true)}
        onAddRelation={(type) => {
          setIsAddingRelation(true);
          setSelectedColumnId(null);
          setRelationParticipation(type); // ← "1|0..*" 등 저장
        }}
      />
    </div>
  );
};

export default ErdCanvas;
