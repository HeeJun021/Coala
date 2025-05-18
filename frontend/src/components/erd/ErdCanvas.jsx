import React, { useRef, useCallback, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import ErdTableBox from "./ErdTableBox";
import FloatingToolButton from "./FloatingToolButton";
import ErdRelationLine from "./ErdRelationLine";

const ErdCanvas = ({
  isPlacing,
  setIsPlacing,
  tables,
  setTables,
  zoomLevel,
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
    // ✅ 실제 박스 드래그일 때만 선택 적용
    if (isDraggingSelectionBox && selectionBox) {
      const { x, y, width, height } = selectionBox;
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
    }

    // ✅ 드래그하지 않았거나 box가 매우 작을 경우 선택 갱신하지 않음
    // (즉, 선택 상태 유지)

    // ✅ 무조건 selectionBox 및 drag 상태 초기화
    setSelectionBox(null);
    setIsDraggingSelectionBox(false);
    dragStartRef.current = null;
    dragOriginRef.current = null;
    tablePositionsRef.current = {};

    setWasDraggingSelectionBox(isDraggingSelectionBox); // 🔴 드래그했음을 기록

    // 플래그는 잠시 뒤 자동 초기화
    setTimeout(() => setWasDraggingSelectionBox(false), 0);
  };

  const handleCanvasClick = (e) => {
    if (wasDraggingSelectionBox) return; // ✅ 드래그 직후면 해제 금지

    setSelectedTableId(null);
    setSelectedTableIds([]);
    setSelectedRelationId(null);
    setSelectedRelationIds([]);

    if (!isPlacing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomLevel;
    const y = (e.clientY - rect.top) / zoomLevel;

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

  const handleUpdateTable = useCallback(
    (updated) => {
      setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    },
    [setTables]
  );

  const handleDeleteTable = useCallback(
    (id) => {
      setTables((prev) => prev.filter((t) => t.id !== id));
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

  const handleColumnClick = (columnId) => {
    if (!isAddingRelation || !selectedRelationType) return;

    if (!pendingFromColumnId) {
      setPendingFromColumnId(columnId);
    } else {
      const newRelation = {
        relationId: uuidv4(),
        fromColumnId: pendingFromColumnId,
        toColumnId: columnId,
        relationType: selectedRelationType,
      };
      setRelations((prev) => [...prev, newRelation]);

      setIsAddingRelation(false);
      setSelectedRelationType(null);
      setPendingFromColumnId(null);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        // ✅ 테이블 삭제
        if (selectedTableIds.length > 0) {
          setTables((prev) =>
            prev.filter((t) => !selectedTableIds.includes(t.id))
          );
          setSelectedTableIds([]);
        }

        // ✅ 관계선 삭제 (배열 기반)
        if (selectedRelationIds.length > 0) {
          setRelations((prev) =>
            prev.filter((r) => !selectedRelationIds.includes(r.relationId))
          );
          setSelectedRelationIds([]);
          setSelectedRelationId(null); // 단일 선택도 초기화
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTableIds, selectedRelationIds, setTables, setRelations]);

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
          key={table.id}
          {...table}
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
