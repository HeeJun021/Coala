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
} from "../../../api/erd/relationApi";
import { saveErdSnapshot } from "../../../api/erd/erdDetailApi";
import {
  setColumnPrimaryKey,
  unsetForeignKey,
} from "../../../api/erd/columnApi";

const ErdCanvas = ({
  isPlacing,
  setIsPlacing,
  tables,
  setTables,
  zoomLevel,
  setZoomLevel,
  erdId,
  relations,
  setRelations,
}) => {
  const canvasRef = useRef(null);

  // 🧱 관계, 위치
  const [columnPositions, setColumnPositions] = useState({});

  // 🧱 관계 생성 상태
  const [isAddingRelation, setIsAddingRelation] = useState(false);
  const [selectedRelationType, setSelectedRelationType] = useState(null);
  const [pendingFromColumnId, setPendingFromColumnId] = useState(null);

  // 🧱 선택 상태
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [selectedTableIds, setSelectedTableIds] = useState([]);
  const [selectedRelationId, setSelectedRelationId] = useState(null);
  const [selectedRelationIds, setSelectedRelationIds] = useState([]);

  // 🧱 드래그 박스 선택
  const [selectionBox, setSelectionBox] = useState(null);
  const [isDraggingSelectionBox, setIsDraggingSelectionBox] = useState(false);
  const [wasDraggingSelectionBox, setWasDraggingSelectionBox] = useState(false);

  // 휠 클릭 드래그(pan) 기능
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  // const [zoom, setZoom] = useState(zoomLevel ?? 1); // 내부 줌 상태 관리

  // 🧱 도구 툴 드래그 여부
  const [isToolDragging, setIsToolDragging] = useState(false);

  // 🧱 드래그 원점, 시작 위치
  const dragStartRef = useRef(null);
  const dragOriginRef = useRef(null);
  const tablePositionsRef = useRef({});
  const handleMouseDown = (e) => {
    if (e.button !== 0 || isToolDragging) return;

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

    setSelectionBox({ x, y, width: 0, height: 0 });
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

    if (box.width > 3 || box.height > 3) {
      setIsDraggingSelectionBox(true);

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
          if (!from || !to) return false;

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

    // 선택 초기화
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

        handleSnapshotSaveWithColumns(updated, relations);
        return updated;
      });
    } catch (err) {
      console.error("테이블 생성 실패:", err);
      alert("테이블 생성 중 오류가 발생했습니다.");
    }

    setIsPlacing(false);
  };

  const handlePanMouseDown = (e) => {
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y,
      };
    }
  };

  const handlePanMouseMove = (e) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
    }
  };

  const handlePanMouseUp = () => {
    setIsPanning(false);
  };

  const handleColumnClick = async (columnId) => {
    if (!isAddingRelation || !selectedRelationType) return;

    if (!pendingFromColumnId) {
      setPendingFromColumnId(columnId);
      return;
    }

    // 🔍 첫 번째 클릭한 컬럼이 PK가 아닐 경우 자동 설정
    const fromTable = tables.find((table) =>
      table.columns.some((col) => col.column_id === pendingFromColumnId)
    );
    const fromColumn = fromTable?.columns.find(
      (col) => col.column_id === pendingFromColumnId
    );

    if (fromColumn && !fromColumn.isPrimaryKey) {
      try {
        await setColumnPrimaryKey(pendingFromColumnId, true);
        setTables((prev) =>
          prev.map((table) => {
            if (table.id !== fromTable.id) return table;
            return {
              ...table,
              columns: table.columns.map((col) =>
                col.column_id === pendingFromColumnId
                  ? { ...col, isPrimaryKey: true }
                  : col
              ),
            };
          })
        );
      } catch (err) {
        console.error("PK 자동 설정 실패:", err);
      }
    }

    try {
      const getTableIdByColumnId = (colId) => {
        for (const table of tables) {
          if (table.columns.some((col) => col.column_id === colId)) {
            return table.id;
          }
        }
        return null;
      };

      let source_column_id = pendingFromColumnId;
      let target_column_id = columnId;
      let source_table_id = getTableIdByColumnId(source_column_id);
      let target_table_id = getTableIdByColumnId(target_column_id);
      let {
        participation_left,
        relation_left,
        relation_right,
        participation_right,
      } = selectedRelationType;

      // 🧠 컬럼의 실제 위치 좌표를 기준으로 방향 보정
      const fromX = columnPositions[source_column_id]?.left ?? 0;
      const toX = columnPositions[target_column_id]?.left ?? 0;

      if (fromX > toX) {
        // 순서 반대일 경우 스왑
        [source_column_id, target_column_id] = [
          target_column_id,
          source_column_id,
        ];
        [source_table_id, target_table_id] = [target_table_id, source_table_id];

        // 관계 타입 좌우 교체
        [participation_left, participation_right] = [
          participation_right,
          participation_left,
        ];
        [relation_left, relation_right] = [relation_right, relation_left];
      }

      if (!source_table_id || !target_table_id) {
        alert("테이블 ID를 찾을 수 없습니다.");
        return;
      }

      const relationData = {
        source_table_id,
        source_column_id,
        target_table_id,
        target_column_id,
        participation_left,
        relation_left,
        relation_right,
        participation_right,
        auto_create_fk: true,
        cascade_delete: false,
      };

      const created = await createRelation(erdId, relationData);

      if (created.fk_column) {
        const fk = created.fk_column;
        setTables((prev) =>
          prev.map((table) => {
            if (table.id !== fk.table_id) return table;
            return {
              ...table,
              columns: table.columns.map((col) =>
                col.column_id === fk.column_id
                  ? { ...col, isForeignKey: true }
                  : col
              ),
            };
          })
        );
      }

      const newRelation = {
        relationId: created.relation_id,
        fromColumnId: created.source_column_id,
        toColumnId: created.target_column_id,
        participation_left: created.participation_left,
        relation_left: created.relation_left,
        relation_right: created.relation_right,
        participation_right: created.participation_right,
      };

      const updatedRelations = [...relations, newRelation];
      setRelations(updatedRelations);

      await handleSnapshotSaveWithColumns(tables, updatedRelations);
    } catch (err) {
      console.error("❌ 관계 생성 실패:", err.response?.data || err);
      alert("관계 생성 중 오류가 발생했습니다.");
    }

    setIsAddingRelation(false);
    setSelectedRelationType(null);
    setPendingFromColumnId(null);
  };

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
  const handleDeleteTable = useCallback(
    async (id) => {
      try {
        await deleteTable(id);
        setTables((prev) => prev.filter((t) => t.id !== id));
      } catch (err) {
        console.error("테이블 삭제 실패:", err);
      }
    },
    [setTables]
  );
  const handleUpdateTable = useCallback(
    (updated) => {
      setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    },
    [setTables]
  );
  const handleColumnPositionUpdate = (tableId, colPosMap) => {
    setColumnPositions((prev) => ({
      ...prev,
      ...colPosMap,
    }));
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
    [erdId]
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
      let serverRelationIds = [];

      if (selectedRelationIds.length > 0) {
        serverRelationIds = selectedRelationIds.filter(
          (id) => typeof id === "number" && !isNaN(id)
        );

        if (serverRelationIds.length > 0) {
          try {
            await deleteMultipleRelations(erdId, serverRelationIds);

            // ✅ FK 해제 처리
            serverRelationIds.forEach((relationId) => {
              const deleted = relations.find(
                (r) => r.relationId === relationId
              );
              if (deleted?.toColumnId) {
                // 1) 서버에 isForeignKey false 요청
                unsetForeignKey(deleted.toColumnId).catch((err) =>
                  console.error("❌ FK 해제 실패:", err)
                );

                // 2) 프론트 테이블 상태도 수정
                updatedTables = updatedTables.map((table) => ({
                  ...table,
                  columns: table.columns.map((col) =>
                    col.column_id === deleted.toColumnId
                      ? { ...col, isForeignKey: false }
                      : col
                  ),
                }));
              }
            });

            updatedRelations = relations.filter(
              (r) => !selectedRelationIds.includes(r.relationId)
            );
            setRelations(updatedRelations);
            setSelectedRelationIds([]);
            setSelectedRelationId(null);
            setTables(updatedTables); // FK 반영된 테이블 상태 반영
            changed = true;
          } catch (err) {
            console.error("관계 삭제 실패:", err);
            alert("관계 삭제 중 오류 발생");
          }
        }
      }

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
    handleSnapshotSaveWithColumns,
    setTables,
    setRelations,
  ]);

  useEffect(() => {
    const handleUpdateOrigin = (e) => {
      const { mouseX, mouseY } = e.detail;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = mouseX - rect.left;
      const y = mouseY - rect.top;

      dragOriginRef.current = { x, y };

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
  useEffect(() => {
    window.addEventListener("mouseup", handlePanMouseUp);
    return () => window.removeEventListener("mouseup", handlePanMouseUp);
  }, []);
  useEffect(() => {
    const handleWheel = (e) => {
      if (!e.ctrlKey) return;

      e.preventDefault();

      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.min(Math.max(zoomLevel + delta, 0.2), 3);

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = newZoom / zoomLevel;

      // 마우스 위치 기준으로 panOffset 보정
      setPanOffset((prev) => ({
        x: mouseX - (mouseX - prev.x) * zoomFactor,
        y: mouseY - (mouseY - prev.y) * zoomFactor,
      }));

      setZoomLevel(newZoom);
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener("wheel", handleWheel);
      }
    };
  }, [zoomLevel, setZoomLevel]);

  return (
    <div
      id="erd-canvas"
      ref={canvasRef}
      onClick={handleCanvasClick}
      onMouseDown={(e) => {
        handleMouseDown(e); // 기존 박스 선택
        handlePanMouseDown(e); // ✅ 중간 클릭 이동
      }}
      onMouseMove={(e) => {
        handleMouseMove(e); // 기존 박스 선택
        handlePanMouseMove(e); // ✅ 중간 클릭 이동
      }}
      onMouseUp={handleMouseUp}
      className={`relative w-full h-full bg-[#1e1e2f] overflow-hidden ${
        isPlacing || isAddingRelation ? "cursor-crosshair" : "cursor-default"
      } select-none`}
    >
      {/* 확대/축소 대상 */}
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: "0 0",
        }}
      >
        {/* 관계선 */}
        {relations.map((rel) => {
          const from = columnPositions[rel.fromColumnId];
          const to = columnPositions[rel.toColumnId];

          return (
            <ErdRelationLine
              key={rel.relationId}
              fromColumn={from}
              toColumn={to}
              participation_left={rel.participation_left}
              relation_left={rel.relation_left}
              relation_right={rel.relation_right}
              participation_right={rel.participation_right}
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

        {/* 테이블들 */}
        {tables.map((table) => (
          <ErdTableBox
            key={table.id}
            erdId={erdId}
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
              // 단순 선택만 가능, 관계 생성 안 함
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
            zoom={zoomLevel}
            panOffset={panOffset}
          />
        ))}

        {/* 드래그 선택 박스 */}
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

      {/* 고정 FloatingToolButton */}
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
