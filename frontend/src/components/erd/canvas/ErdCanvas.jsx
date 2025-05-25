import React, { useRef, useCallback, useState, useEffect } from "react";
import ErdTableBox from "./ErdTableBox";
import FloatingToolButton from "./FloatingToolButton";
import ErdRelationLine from "./ErdRelationLine";

import {
  createTable,
  deleteTable,
  deleteMultipleTables,
} from "../../../api/erd/tableApi";
import {
  createRelation,
  deleteMultipleRelations,
} from "../../../api/erd/relationApi"; // 상단에 추가

import { saveErdSnapshot } from "../../../api/erd/erdDetailApi";

const ErdCanvas = ({
  isPlacing,
  setIsPlacing,
  tables,
  setTables,
  zoomLevel,
  erdId,
}) => {
  const canvasRef = useRef(null);

  const [relations, setRelations] = useState([]);
  const [isAddingRelation, setIsAddingRelation] = useState(false);
  const [selectedRelationType, setSelectedRelationType] = useState(null);
  const [pendingFromColumnId, setPendingFromColumnId] = useState(null);
  const [columnPositions, setColumnPositions] = useState({});

  const [selectedTableId, setSelectedTableId] = useState(null);
  const [selectedTableIds, setSelectedTableIds] = useState([]);
  const [selectedRelationId, setSelectedRelationId] = useState(null);
  const [selectedRelationIds, setSelectedRelationIds] = useState([]);

  const [selectionBox, setSelectionBox] = useState(null);

  const [isToolDragging, setIsToolDragging] = useState(false); // 🆕 툴탭 드래그 중 여부

  const [isDraggingSelectionBox, setIsDraggingSelectionBox] = useState(false);
  const [wasDraggingSelectionBox, setWasDraggingSelectionBox] = useState(false);

  const dragStartRef = useRef(null);
  const dragOriginRef = useRef(null);
  const tablePositionsRef = useRef({});

  const handleMouseDown = (e) => {
    if (e.button !== 0 || isToolDragging) return; // 🛑 툴탭 드래그 중이면 무시
    if (e.button !== 0) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomLevel;
    const y = (e.clientY - rect.top) / zoomLevel;

    dragStartRef.current = { x, y };
    dragOriginRef.current = { x, y };

    tablePositionsRef.current = {};
    selectedTableIds.forEach((id) => {
      const t = tables.find((t) => t.id === id);
      if (t) {
        tablePositionsRef.current[id] = { x: t.x, y: t.y };
      }
    });

    if (!isToolDragging) {
      setSelectionBox({ x, y, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e) => {
    if (!dragStartRef.current || isToolDragging) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomLevel;
    const y = (e.clientY - rect.top) / zoomLevel;

    const startX = dragStartRef.current.x;
    const startY = dragStartRef.current.y;
    const box = {
      x: Math.min(x, startX),
      y: Math.min(y, startY),
      width: Math.abs(x - startX),
      height: Math.abs(y - startY),
    };

    setSelectionBox(box);

    // ✅ selectionBox 크기가 3px 이상이면 진짜 박스로 간주
    if (box.width > 3 || box.height > 3) {
      setIsDraggingSelectionBox(true);

      // ✅ 진짜 박스 드래그일 때만 선택 갱신
      const selected = tables
        .filter((t) => {
          const tableWidth = 440;
          const tableHeight = 100;
          return (
            t.x < box.x + box.width &&
            t.x + tableWidth > box.x &&
            t.y < box.y + box.height &&
            t.y + tableHeight > box.y
          );
        })
        .map((t) => t.id);

      setSelectedTableIds(selected);

      const selectedRelations = relations
        .filter((rel) => {
          const from = columnPositions[rel.fromColumnId];
          const to = columnPositions[rel.toColumnId];

          if (
            !from ||
            !to ||
            from.left === undefined ||
            from.right === undefined ||
            from.y === undefined ||
            to.left === undefined ||
            to.right === undefined ||
            to.y === undefined
          ) {
            return false;
          }

          const fromX = from.left < to.left ? from.right : from.left;
          const toX = from.left < to.left ? to.left : to.right;
          const midX = (fromX + toX) / 2;
          const midY = (from.y + to.y) / 2;

          return (
            midX >= box.x &&
            midX <= box.x + box.width &&
            midY >= box.y &&
            midY <= box.y + box.height
          );
        })
        .map((rel) => rel.relationId);

      setSelectedRelationIds(selectedRelations);
    }
  };

  const handleMouseUp = () => {
    if (isDraggingSelectionBox && selectionBox) {
      const { x, y, width, height } = selectionBox;

      // ✅ 선택된 테이블 ID 추출
      const selected = tables
        .filter(
          (t) =>
            t.x + 440 >= x &&
            t.x <= x + width &&
            t.y + 100 >= y &&
            t.y <= y + height
        )
        .map((t) => t.id);

      setSelectedTableIds(selected);

      // ✅ 선택된 테이블 간의 관계선도 함께 선택
      const getTableIdByColumnId = (columnId) => {
        for (const table of tables) {
          if (table.columns.some((col) => col.column_id === columnId)) {
            return table.id;
          }
        }
        return null;
      };

      const tableIdSet = new Set(selected);
      const relatedRelationIds = relations
        .filter((rel) => {
          const fromTableId = getTableIdByColumnId(rel.fromColumnId);
          const toTableId = getTableIdByColumnId(rel.toColumnId);
          return tableIdSet.has(fromTableId) && tableIdSet.has(toTableId);
        })
        .map((rel) => rel.relationId);

      setSelectedRelationIds(relatedRelationIds);
    }

    setSelectionBox(null);
    setIsDraggingSelectionBox(false);
    dragStartRef.current = null;
    dragOriginRef.current = null;
    tablePositionsRef.current = {};

    setWasDraggingSelectionBox(isDraggingSelectionBox);

    setTimeout(() => setWasDraggingSelectionBox(false), 0);
  };

  const handleCanvasClick = async (e) => {
    if (wasDraggingSelectionBox) return;

    setSelectedTableId(null);
    setSelectedTableIds([]);
    setSelectedRelationId(null);
    setSelectedRelationIds([]);

    if (!isPlacing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomLevel;
    const y = (e.clientY - rect.top) / zoomLevel;

    try {
      const newTable = await createTable(erdId, {
        pos_x: Math.round(x),
        pos_y: Math.round(y),
      });

      console.log("🧪 newTable 응답 확인", newTable);

      setTables((prev) => {
        const updated = [
          ...prev,
          {
            id: newTable.table_id,
            x: newTable.pos_x,
            y: newTable.pos_y,
            tableName: newTable.name,
            columns: [],
          },
        ];

        // ✅ 테이블 추가 완료 후 스냅샷 저장
        handleSnapshotSaveWithColumns(updated, relations);
        return updated;
      });
    } catch (err) {
      console.error("테이블 생성 실패:", err);
      alert("테이블 생성 중 오류가 발생했습니다.");
    }

    setIsPlacing(false);
  };

  const handleColumnPositionUpdate = (tableId, colPosMap) => {
    setColumnPositions((prev) => ({
      ...prev,
      ...colPosMap,
    }));
  };

  const handleUpdateTable = useCallback(
    (updated) => {
      setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    },
    [setTables]
  );

  const handleDeleteTable = useCallback(
    async (id) => {
      try {
        await deleteTable(id); // ✅ erdId는 전달하지 않음
        setTables((prev) => prev.filter((t) => t.id !== id));
      } catch (err) {
        console.error("테이블 삭제 실패:", err);
      }
    },
    [setTables]
  );

  const handleBatchUpdateTablePosition = (movedTableId, mouseX, mouseY) => {
    if (!dragOriginRef.current || !tablePositionsRef.current) return;

    const deltaX = mouseX - dragOriginRef.current.x;
    const deltaY = mouseY - dragOriginRef.current.y;

    setTables((prevTables) =>
      prevTables.map((t) => {
        if (selectedTableIds.includes(t.id)) {
          const original = tablePositionsRef.current[t.id];
          if (!original) return t;
          return {
            ...t,
            x: original.x + deltaX,
            y: original.y + deltaY,
          };
        }
        return t;
      })
    );
  };
  useEffect(() => {
    const handleUpdateOrigin = (e) => {
      const { mouseX, mouseY } = e.detail;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = mouseX - rect.left;
      const y = mouseY - rect.top;

      dragOriginRef.current = { x, y };

      // 선택된 테이블들의 기준 위치 초기화
      tablePositionsRef.current = {};
      selectedTableIds.forEach((id) => {
        const t = tables.find((t) => t.id === id);
        if (t) {
          tablePositionsRef.current[id] = { x: t.x, y: t.y };
        }
      });
    };

    window.addEventListener("update-drag-origin", handleUpdateOrigin);
    return () => {
      window.removeEventListener("update-drag-origin", handleUpdateOrigin);
    };
  }, [tables, selectedTableIds]);

  const handleColumnClick = async (columnId) => {
    if (!isAddingRelation || !selectedRelationType) return;

    if (!pendingFromColumnId) {
      setPendingFromColumnId(columnId);
    } else {
      try {
        const relationTypeMapForBackend = {
          "1|1": "1..1",
          "1|0..1": "1..0..1",
          "1|1..*": "1..1..*",
          "1|0..*": "1..0..*",
          "0..1|1": "0..1..1",
          "0..1|1..*": "0..1..1..*",
          "0..1|0..*": "0..1..0..*",
          "1..*|1..*": "1..*..1..*",
          "1..*|0..*": "1..*..0..*",
          "0..*|1..*": "0..*..1..*",
        };

        const relation_type = relationTypeMapForBackend[selectedRelationType];
        if (!relation_type) {
          alert("잘못된 관계 타입입니다.");
          return;
        }

        const getTableIdByColumnId = (colId) => {
          for (const table of tables) {
            if (table.columns.some((col) => col.column_id === colId)) {
              return table.id;
            }
          }
          return null;
        };

        const source_table_id = getTableIdByColumnId(pendingFromColumnId);
        const target_table_id = getTableIdByColumnId(columnId);
        if (!source_table_id || !target_table_id) {
          alert("테이블 ID를 찾을 수 없습니다.");
          return;
        }

        const relationData = {
          source_table_id,
          source_column_id: pendingFromColumnId,
          target_table_id,
          target_column_id: columnId,
          relation_type,
        };

        const created = await createRelation(erdId, relationData);

        const newRelation = {
          relationId: created.relation_id,
          fromColumnId: created.source_column_id,
          toColumnId: created.target_column_id,
          relationType: created.relation_type,
        };

        const updatedRelations = [...relations, newRelation];
        setRelations(updatedRelations);

        // ✅ 스냅샷 저장
        await handleSnapshotSaveWithColumns(tables, updatedRelations);
      } catch (err) {
        console.error("❌ 관계 생성 실패:", err.response?.data || err);
        alert("관계 생성 중 오류가 발생했습니다.");
      }

      setIsAddingRelation(false);
      setSelectedRelationType(null);
      setPendingFromColumnId(null);
    }
  };

  const handleSnapshotSaveWithColumns = useCallback(
    async (newTables, newRelations) => {
      const allColumns = newTables.flatMap((table) =>
        (table.columns || []).map((column) => ({
          ...column,
          table_id: table.id,
        }))
      );

      try {
        await saveErdSnapshot(erdId, {
          tables: newTables,
          columns: allColumns,
          relations: newRelations,
        });
        console.log("✅ 스냅샷 저장 완료");
      } catch (err) {
        console.error("❌ 스냅샷 저장 실패:", err);
      }
    },
    [erdId] // ✅ 의존성은 erdId만
  );

  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (e.key !== "Delete") return;

      let updatedTables = tables;
      let updatedRelations = relations;
      let changed = false;

      // ✅ 테이블 삭제
      if (selectedTableIds.length > 0) {
        try {
          await deleteMultipleTables(erdId, selectedTableIds);
          updatedTables = tables.filter(
            (t) => !selectedTableIds.includes(t.id)
          );
          setTables(updatedTables);
          setSelectedTableIds([]);
          changed = true;
        } catch (err) {
          console.error("다중 테이블 삭제 실패:", err);
        }
      }

      // ✅ 관계 삭제
      if (selectedRelationIds.length > 0) {
        const serverRelationIds = selectedRelationIds.filter(
          (id) => typeof id === "number" && !isNaN(id)
        );

        if (serverRelationIds.length > 0) {
          try {
            await deleteMultipleRelations(erdId, serverRelationIds);
            updatedRelations = relations.filter(
              (r) => !selectedRelationIds.includes(r.relationId)
            );
            setRelations(updatedRelations);
            setSelectedRelationIds([]);
            setSelectedRelationId(null);
            changed = true;
          } catch (err) {
            console.error("관계 삭제 실패:", err);
            alert("관계 삭제 중 오류 발생");
          }
        }
      }

      // ✅ 삭제 후에만 스냅샷 저장
      if (changed) {
        handleSnapshotSaveWithColumns(updatedTables, updatedRelations);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedTableIds,
    selectedRelationIds,
    tables,
    relations,
    erdId,
    setTables,
    setRelations,
    handleSnapshotSaveWithColumns,
  ]);

  return (
    <div
      id="erd-canvas"
      ref={canvasRef}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative w-full h-full bg-[#1e1e2f] overflow-hidden ${
        isPlacing || isAddingRelation ? "cursor-crosshair" : "cursor-default"
      } select-none`}
    >
      {/* 확대/축소 대상 내부 컨테이너 */}
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          transform: `scale(${zoomLevel})`,
          width: `${100 / zoomLevel}%`,
          height: `${100 / zoomLevel}%`,
        }}
      >
        {relations.map((rel) => {
          const from = columnPositions[rel.fromColumnId];
          const to = columnPositions[rel.toColumnId];

          return (
            <ErdRelationLine
              key={rel.relationId}
              fromColumn={from}
              toColumn={to}
              label={rel.relationType}
              isSelected={
                selectedRelationIds.includes(rel.relationId) ||
                selectedRelationId === rel.relationId
              }
              onClick={() => {
                setSelectedRelationId(rel.relationId);
                setSelectedRelationIds([rel.relationId]);
                setSelectedTableId(null);
                setSelectedTableIds([]);
              }}
            />
          );
        })}

        {tables.map((table) => (
          <ErdTableBox
            erdId={erdId} // ✅ 전달
            {...table}
            key={table.id}
            onUpdate={handleUpdateTable}
            onDelete={() => handleDeleteTable(table.id)}
            isAddingRelation={isAddingRelation}
            selectedColumnId={pendingFromColumnId}
            onColumnClick={handleColumnClick}
            onColumnPositionUpdate={handleColumnPositionUpdate}
            isSelected={
              selectedTableIds.includes(table.id) ||
              selectedTableId === table.id
            }
            onClick={() => {
              setSelectedTableId(table.id);
              setSelectedTableIds([table.id]);
              setSelectedRelationId(null);
              setSelectedRelationIds([]);
            }}
            onDragMove={(mouseX, mouseY) =>
              handleBatchUpdateTablePosition(table.id, mouseX, mouseY)
            }
            onSnapshotRequest={() =>
              handleSnapshotSaveWithColumns(tables, relations)
            }
          />
        ))}

        {selectionBox && selectionBox.width > 0 && selectionBox.height > 0 && (
          <div
            className="absolute border-2 border-blue-400 bg-blue-300/20 z-50 pointer-events-none"
            style={{
              top: selectionBox.y,
              left: selectionBox.x,
              width: selectionBox.width,
              height: selectionBox.height,
            }}
          />
        )}
      </div>

      {/* 고정 위치 FloatingToolButton (확대 X) */}
      <FloatingToolButton
        onAddTable={() => setIsPlacing(true)}
        onAddRelation={(type) => {
          setIsAddingRelation(true);
          setSelectedRelationType(type);
          setPendingFromColumnId(null);
        }}
        onStartDragging={() => setIsToolDragging(true)}
        onStopDragging={() => setIsToolDragging(false)}
      />
    </div>
  );
};

export default ErdCanvas;
