import React, { useRef, useCallback, useState, useEffect } from "react";
import ErdTableBox from "./ErdTableBox";
import FloatingToolButton from "./FloatingToolButton";
import ErdRelationLine from "./ErdRelationLine";

import {
  createTable,
  deleteTable,
  deleteMultipleTables,
  patchTable,
} from "../../../api/erd/tableApi";
import {
  createRelation,
  deleteMultipleRelations,
} from "../../../api/erd/relationApi";
import {
  saveErdSnapshot,
  patchErdViewPosition,
} from "../../../api/erd/erdDetailApi";
import { debounce } from "lodash"; // 또는 직접 만든 debounce 함수
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
  fetchErdDetail,
  showToast,
  panOffset,
  setPanOffset,
}) => {
  const canvasRef = useRef(null);

  // draw.io 스타일 격자
  const MINOR_STEP = 16; // 미세 격자 간격(px)
  const MAJOR_EVERY = 6; // 몇 칸마다 주격자(진한 선)
  const MAJOR_STEP = MINOR_STEP * MAJOR_EVERY;
  const MINOR_COLOR = "#e5e7eb"; // gray-200
  const MAJOR_COLOR = "#d1d5db"; // gray-300
  // 🧱 관계, 위치
  const [columnPositions, setColumnPositions] = useState({});

  // 테이블/컬럼 구조가 바뀌어도, 기존 앵커는 살리고 사라진 컬럼만 제거 (깜빡임 방지)
  useEffect(() => {
    setColumnPositions((prev) => {
      const valid = new Set();
      tables.forEach((t) =>
        (t.columns || []).forEach((c) => valid.add(String(c.column_id ?? c.id)))
      );
      const next = {};
      for (const [key, val] of Object.entries(prev)) {
        if (valid.has(String(key))) next[key] = val;
      }
      return next;
    });
  }, [tables]);

  // 🧱 관계 생성 상태
  const [isAddingRelation, setIsAddingRelation] = useState(false);
  const [selectedRelationType, setSelectedRelationType] = useState(null);
  const [pendingFromColumnId, setPendingFromColumnId] = useState(null);

  // 선택 상태
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [selectedTableIds, setSelectedTableIds] = useState([]);
  const [selectedRelationId, setSelectedRelationId] = useState(null);
  const [selectedRelationIds, setSelectedRelationIds] = useState([]);

  // 드래그 박스 선택
  const [selectionBox, setSelectionBox] = useState(null);
  const [isDraggingSelectionBox, setIsDraggingSelectionBox] = useState(false);
  const [wasDraggingSelectionBox, setWasDraggingSelectionBox] = useState(false);

  // 휠 클릭 드래그(pan) 기능
  const [isPanning, setIsPanning] = useState(false);

  const panOffsetRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const [hasInteracted, setHasInteracted] = useState(false);

  // 컬럼 호버 하이라이트
  const [hoveredColumnId, setHoveredColumnId] = useState(null);

  // 도구 툴 드래그 여부
  const [isToolDragging, setIsToolDragging] = useState(false);

  // 드래그 원점, 시작 위치
  const dragStartRef = useRef(null);
  const dragOriginRef = useRef(null);
  const tablePositionsRef = useRef({});

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isPlacing) setIsPlacing(false);
        if (isAddingRelation) setIsAddingRelation(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlacing, isAddingRelation, setIsPlacing, setIsAddingRelation]);

  // 1. 드래그 시작
  const handleMouseDown = (e) => {
    if (e.button !== 0 || isToolDragging) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - panOffset.x) / zoomLevel;
    const mouseY = (e.clientY - rect.top - panOffset.y) / zoomLevel;

    dragStartRef.current = { x: mouseX, y: mouseY };
    dragOriginRef.current = { x: mouseX, y: mouseY };

    tablePositionsRef.current = {};
    selectedTableIds.forEach((id) => {
      const t = tables.find((t) => t.id === id);
      if (t) {
        tablePositionsRef.current[id] = { x: t.x, y: t.y };
      }
    });

    setSelectionBox({ x: mouseX, y: mouseY, width: 0, height: 0 });
  };

  const handleMouseMove = (e) => {
    if (!dragStartRef.current || isToolDragging) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoomLevel;
    const y = (e.clientY - rect.top - panOffset.y) / zoomLevel;

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

    // 위치가 바뀐 테이블만 골라내기
    let moved = false;
    const movedTables = [];

    const updatedTables = tables.map((t) => {
      const original = tablePositionsRef.current[t.id];
      if (!original) return t;

      const dx = Math.round(t.x) - Math.round(original.x);
      const dy = Math.round(t.y) - Math.round(original.y);

      if (dx !== 0 || dy !== 0) {
        moved = true;
        movedTables.push(t); // 위치가 실제로 바뀐 테이블만 모음
      }

      return t;
    });

    if (moved) {
      // movedTables만 patch
      const updatePromises = movedTables.map((t) =>
        patchTable(erdId, t.id, {
          pos_x: Math.round(t.x),
          pos_y: Math.round(t.y),
        })
      );
      Promise.all(updatePromises).catch((err) =>
        console.error("🛑 테이블 위치 업데이트 실패:", err)
      );

      // 전체 상태로 스냅샷 저장
      handleSnapshotSaveWithColumns(updatedTables, relations);
    }

    // 초기화
    setSelectionBox(null);
    setIsDraggingSelectionBox(false);
    dragStartRef.current = null;
    dragOriginRef.current = null;
    tablePositionsRef.current = {};

    setWasDraggingSelectionBox(isDraggingSelectionBox);
    setTimeout(() => setWasDraggingSelectionBox(false), 0);
  };
  const measureColumnAnchor = useCallback(
    (columnId) => {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      // 해당 컬럼 DOM 찾기
      const el = document.querySelector(`[data-column-id='${columnId}']`);
      const tableBox = el?.closest(".erd-table-box");
      if (!el || !tableBox) return;

      const tableRect = tableBox.getBoundingClientRect();
      const colRect = el.getBoundingClientRect();

      const adjustedLeft =
        (tableRect.left - canvasRect.left - panOffset.x) / zoomLevel;
      const adjustedRight =
        (tableRect.right - canvasRect.left - panOffset.x) / zoomLevel;
      const adjustedY =
        (colRect.top - canvasRect.top - panOffset.y + colRect.height / 2) /
        zoomLevel;

      setColumnPositions((prev) => ({
        ...prev,
        [String(columnId)]: {
          left: adjustedLeft,
          right: adjustedRight,
          y: adjustedY,
        },
      }));
    },
    [panOffset.x, panOffset.y, zoomLevel]
  );

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
      const newOffset = {
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      };
      setPanOffset(newOffset);
      panOffsetRef.current = newOffset; // 👈 여기가 핵심
      setHasInteracted(true);
    }
  };

  const saveViewPosition = debounce((x, y) => {
    patchErdViewPosition(erdId, {
      view_x: Math.round(x),
      view_y: Math.round(y),
    });
  }, 100);
  const handlePanMouseUp = useCallback(() => {
    setIsPanning(false);
    if (hasInteracted) {
      saveViewPosition(panOffsetRef.current.x, panOffsetRef.current.y);
      console.log(
        "🔍 저장되는 panOffset:",
        panOffsetRef.current.x,
        panOffsetRef.current.y
      );
      setHasInteracted(false); // ✅ 저장 후 초기화
    }
  }, [hasInteracted, saveViewPosition]);

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

      let { relation_type, participation_source, participation_target } =
        selectedRelationType;

      if (!source_table_id || !target_table_id) {
        alert("테이블 ID를 찾을 수 없습니다.");
        return;
      }

      // 백엔드 명세에 맞게 구성
      const relationData = {
        source_table_id,
        source_column_id,
        target_table_id,
        target_column_id,
        relation_type, // "1:1" or "1:N"
        participation_source,
        participation_target,
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

      // 렌더링용 변환
      const relationVisual =
        relation_type === "1:N"
          ? { relation_left: "bar", relation_right: "crow" }
          : { relation_left: "bar", relation_right: "bar" };

      const newRelation = {
        relationId: created.relation_id,
        fromColumnId: created.source_column_id,
        toColumnId: created.target_column_id,
        participation_left: created.participation_source,
        relation_left: relationVisual.relation_left,
        relation_right: relationVisual.relation_right,
        participation_right: created.participation_target,
      };

      // 두 컬럼의 앵커를 즉시 채워 깜빡임 방지
      measureColumnAnchor(created.source_column_id);
      measureColumnAnchor(created.target_column_id);

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

  // 2. 선택된 테이블 일괄 이동
  const handleBatchUpdateTablePosition = (movedTableId, mouseX, mouseY) => {
    if (!dragOriginRef.current || !tablePositionsRef.current) return;

    const deltaX = mouseX - dragOriginRef.current.x;
    const deltaY = mouseY - dragOriginRef.current.y;

    const updatedTables = tables.map((t) => {
      if (selectedTableIds.includes(t.id)) {
        const origin = tablePositionsRef.current[t.id];
        return origin
          ? { ...t, x: origin.x + deltaX, y: origin.y + deltaY }
          : t;
      }
      return t;
    });

    setTables(updatedTables);

    setTimeout(() => {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const updatedPositions = {};

      updatedTables.forEach((table) => {
        if (!selectedTableIds.includes(table.id)) return;
        const tableBox = document.querySelector(
          `.erd-table-box[data-id='${table.id}']`
        );
        if (!tableBox) return;

        const columnEls = tableBox.querySelectorAll("[data-column-id]");
        const tableRect = tableBox.getBoundingClientRect();

        columnEls.forEach((el) => {
          const colId = el.getAttribute("data-column-id");
          const colRect = el.getBoundingClientRect();
          const adjustedLeft =
            (tableRect.left - canvasRect.left - panOffset.x) / zoomLevel;
          const adjustedRight =
            (tableRect.right - canvasRect.left - panOffset.x) / zoomLevel;
          const adjustedY =
            (colRect.top - canvasRect.top - panOffset.y + colRect.height / 2) /
            zoomLevel;

          updatedPositions[colId] = {
            left: adjustedLeft,
            right: adjustedRight,
            y: adjustedY,
          };
        });
      });

      setColumnPositions((prev) => ({
        ...prev,
        ...updatedPositions,
      }));
    }, 0);
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

      // 테이블 삭제
      if (selectedTableIds.length > 0) {
        try {
          await deleteMultipleTables(erdId, selectedTableIds);

          updatedTables = tables.filter(
            (t) => !selectedTableIds.includes(t.id)
          );

          setSelectedTableIds([]);
          changed = true;
        } catch (err) {
          console.error("다중 테이블 삭제 실패:", err);
        }
      }

      // 관계 삭제
      let serverRelationIds = [];

      if (selectedRelationIds.length > 0) {
        serverRelationIds = selectedRelationIds.filter(
          (id) => typeof id === "number" && !isNaN(id)
        );

        if (serverRelationIds.length > 0) {
          try {
            await deleteMultipleRelations(erdId, serverRelationIds);

            for (const relationId of serverRelationIds) {
              const deleted = relations.find(
                (r) => r.relationId === relationId
              );
              if (deleted?.toColumnId) {
                try {
                  await unsetForeignKey(deleted.toColumnId); 
                } catch (err) {
                  console.error("❌ FK 해제 실패:", err);
                }

                updatedTables = updatedTables.map((table) => ({
                  ...table,
                  columns: table.columns.map((col) =>
                    col.column_id === deleted.toColumnId
                      ? { ...col, isForeignKey: false }
                      : col
                  ),
                }));
              }
            }

            updatedRelations = relations.filter(
              (r) => !selectedRelationIds.includes(r.relationId)
            );

            setSelectedRelationIds([]);
            setSelectedRelationId(null);
            changed = true;
          } catch (err) {
            console.error("관계 삭제 실패:", err);
            alert("관계 삭제 중 오류 발생");
          }
        }
      }

      // 상태 변경된 경우에만 스냅샷 먼저 저장한 후 상태 반영
      if (changed) {
        console.log("📸 스냅샷 저장 시작");
        handleSnapshotSaveWithColumns(updatedTables, updatedRelations);
        setTables(updatedTables);
        setRelations(updatedRelations);
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
      dragOriginRef.current = {
        x: Math.round((mouseX - rect.left - panOffset.x) / zoomLevel),
        y: Math.round((mouseY - rect.top - panOffset.y) / zoomLevel),
      };

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
  }, [tables, selectedTableIds, panOffset.x, panOffset.y, zoomLevel]);

  useEffect(() => {
    window.addEventListener("mouseup", handlePanMouseUp);
    return () => window.removeEventListener("mouseup", handlePanMouseUp);
  }, [handlePanMouseUp]);
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
  }, [zoomLevel, setZoomLevel, setPanOffset]);

  return (
    <div
      id="erd-canvas"
      ref={canvasRef}
      onClick={handleCanvasClick}
      onMouseDown={(e) => {
        handleMouseDown(e); // 기존 박스 선택
        handlePanMouseDown(e); // 중간 클릭 이동
      }}
      onMouseMove={(e) => {
        handleMouseMove(e); // 기존 박스 선택
        handlePanMouseMove(e); // 중간 클릭 이동
      }}
      onMouseUp={handleMouseUp}
      className={`relative w-full h-full overflow-hidden ${
        isPlacing || isAddingRelation ? "cursor-crosshair" : "cursor-default"
      } select-none`}
      style={{
        backgroundColor: "#ffffff",
        // ⬇️ 미세 격자(옅음) + 주격자(진함) 두 세트 겹치기
        backgroundImage: `
      linear-gradient(${MINOR_COLOR} 1px, transparent 1px),
      linear-gradient(90deg, ${MINOR_COLOR} 1px, transparent 1px),
      linear-gradient(${MAJOR_COLOR} 1px, transparent 1px),
      linear-gradient(90deg, ${MAJOR_COLOR} 1px, transparent 1px)
    `,
        backgroundSize: `
      ${MINOR_STEP * zoomLevel}px ${MINOR_STEP * zoomLevel}px,
      ${MINOR_STEP * zoomLevel}px ${MINOR_STEP * zoomLevel}px,
      ${MAJOR_STEP * zoomLevel}px ${MAJOR_STEP * zoomLevel}px,
      ${MAJOR_STEP * zoomLevel}px ${MAJOR_STEP * zoomLevel}px
    `,
        backgroundPosition: `
      ${panOffset.x}px ${panOffset.y}px,
      ${panOffset.x}px ${panOffset.y}px,
      ${panOffset.x}px ${panOffset.y}px,
      ${panOffset.x}px ${panOffset.y}px
    `,
      }}
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
            hoveredColumnId={hoveredColumnId}
            setHoveredColumnId={setHoveredColumnId}
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
            tablePositionsRef={tablePositionsRef}
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
        erdId={erdId}
        fetchErdDetail={fetchErdDetail}
        onAddTable={() => setIsPlacing(true)}
        onAddRelation={(type) => {
          setIsAddingRelation(true);
          setSelectedRelationType(type);
          setPendingFromColumnId(null);
        }}
        onStartDragging={() => setIsToolDragging(true)}
        onStopDragging={() => setIsToolDragging(false)}
        showToast={showToast}
      />
    </div>
  );
};

export default ErdCanvas;
