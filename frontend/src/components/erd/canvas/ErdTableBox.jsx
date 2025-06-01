import React, { useState, useRef, useEffect } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";
import ErdColumnRow from "./ErdColumnRow";
import { useDragColumn } from "../drag/useDragColumn";

import { patchTable } from "../../../api/erd/tableApi";
import {
  createColumn,
  deleteColumn,
  reorderColumns,
} from "../../../api/erd/columnApi";

const ErdTableBox = ({
  id,
  x,
  y,
  tableName,
  description,
  columns,
  onUpdate,
  onDelete,
  onClick,
  onColumnPositionUpdate,
  onColumnClick,
  isSelected,
  onDragMove,
  erdId,
  onSnapshotRequest,
  zoom,
  panOffset,
  isAddingRelation,
  hoveredColumnId,
  setHoveredColumnId,
  tablePositionsRef,
}) => {
  // 🧱 테이블 기본 정보 (로컬)
  const [localName, setLocalName] = useState(tableName || "");
  const [localDesc, setLocalDesc] = useState(description || "");
  const [localColumns, setLocalColumns] = useState(() => columns || []);
  useEffect(() => {
    setLocalColumns(columns || []);
  }, [columns]);

  // 🧱 DOM 참조 및 위치 계산용
  const tableRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const columnPositionsRef = useRef({});

  // 🧱 컬럼 드래그 상태
  const { dragIndex, hoverIndex, setHoverIndex, startDrag, endDrag } =
    useDragColumn();
  const generateTableUpdateData = (key, value) => {
    switch (key) {
      case "tableName":
        return { name: value };
      case "description":
        return { description: value };
      default:
        return {};
    }
  };

  const handleTableFieldChange = (key, value) => {
    // 로컬 상태만 반영
    if (key === "tableName") setLocalName(value);
    if (key === "description") setLocalDesc(value);
  };
  const handleTableFieldBlur = (key) => {
    const value = key === "tableName" ? localName : localDesc;

    const updateData = generateTableUpdateData(key, value);

    patchTable(erdId, id, updateData)
      .then(() => {
        // ✅ 스냅샷 저장
        onSnapshotRequest?.();
      })
      .catch((err) => {
        console.error("테이블 수정 실패", err);
      });

    // 업데이트된 값을 상위에도 반영
    onUpdate({
      id,
      x,
      y,
      tableName: key === "tableName" ? value : localName,
      description: key === "description" ? value : localDesc,
      columns: localColumns,
    });
  };

  const handleReorderColumns = async (from, to) => {
    if (from === to || from == null || to == null) return;

    const newCols = [...localColumns];
    const [moved] = newCols.splice(from, 1);
    newCols.splice(to, 0, moved);
    setLocalColumns(newCols);

    // ✅ 백엔드로 순서 업데이트 요청
    try {
      const newColumnIds = newCols.map((c) => c.id); // 서버에 보낼 column_id 배열
      await reorderColumns(id, newColumnIds);
    } catch (err) {
      console.error("컬럼 순서 변경 실패:", err);
    }

    // ✅ 부모에게 업데이트 반영
    onUpdate({
      id,
      x,
      y,
      tableName: localName,
      description: localDesc,
      columns: newCols,
    });
  };

  const handleColumnPosUpdate = (colId, el) => {
    if (!tableRef.current || !el) return;

    const canvasRect = document
      .getElementById("erd-canvas")
      ?.getBoundingClientRect();
    const tableRect = tableRef.current.getBoundingClientRect();
    const colRect = el.getBoundingClientRect();

    if (!canvasRect) return;

    // ✅ transform 보정 적용
    const adjustedLeft =
      (tableRect.left - canvasRect.left - panOffset.x) / zoom;
    const adjustedRight =
      (tableRect.right - canvasRect.left - panOffset.x) / zoom;
    const adjustedY =
      (colRect.top - canvasRect.top - panOffset.y + colRect.height / 2) / zoom;

    columnPositionsRef.current[colId] = {
      left: adjustedLeft,
      right: adjustedRight,
      y: adjustedY,
    };
  };

  const handleTogglePK = (targetId) => {
    setLocalColumns((prev) =>
      prev.map((col) =>
        col.id === targetId ? { ...col, isPrimaryKey: !col.isPrimaryKey } : col
      )
    );
  };
  useEffect(() => {
    onUpdate({
      id,
      x,
      y,
      tableName: localName,
      description: localDesc,
      columns: localColumns,
    });
  }, [id, x, y, localName, localDesc, localColumns, onUpdate]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (onColumnPositionUpdate) {
        onColumnPositionUpdate(id, { ...columnPositionsRef.current });
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [id, onColumnPositionUpdate, panOffset.x, panOffset.y, zoom]);

  const handleMouseDown = (e) => {
    if (!e.ctrlKey && !isSelected) {
      window.dispatchEvent(
        new CustomEvent("select-single-table", { detail: id })
      );
    }

    draggingRef.current = true;
    const rect = tableRef.current.getBoundingClientRect();
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    e.stopPropagation();

    // ✅ 드래그 기준점 위치 강제 업데이트
    window.dispatchEvent(
      new CustomEvent("update-drag-origin", {
        detail: {
          mouseX: e.clientX,
          mouseY: e.clientY,
        },
      })
    );
  };
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!draggingRef.current) return;

      const canvasRect = document
        .getElementById("erd-canvas")
        ?.getBoundingClientRect();
      if (!canvasRect) return;

      const adjustedX = (e.clientX - canvasRect.left - panOffset.x) / zoom;
      const adjustedY = (e.clientY - canvasRect.top - panOffset.y) / zoom;

      // ✅ 실시간 컬럼 좌표 계산 유지
      if (tableRef.current) {
        const tableRect = tableRef.current.getBoundingClientRect();
        const columnElements =
          tableRef.current.querySelectorAll("[data-column-id]");

        columnElements.forEach((el) => {
          const colId = el.getAttribute("data-column-id");
          const rect = el.getBoundingClientRect();

          const adjustedLeft =
            (tableRect.left - canvasRect.left - panOffset.x) / zoom;
          const adjustedRight =
            (tableRect.right - canvasRect.left - panOffset.x) / zoom;
          const adjustedY =
            (rect.top - canvasRect.top - panOffset.y + rect.height / 2) / zoom;

          columnPositionsRef.current[colId] = {
            left: adjustedLeft,
            right: adjustedRight,
            y: adjustedY,
          };
        });

        if (onColumnPositionUpdate) {
          onColumnPositionUpdate(id, { ...columnPositionsRef.current });
        }
      }

      // ✅ 선택된 경우 보정된 좌표 전달
      // ✅ 선택된 테이블은 직접 움직이지 않음
      if (isSelected && onDragMove) {
        onDragMove(adjustedX, adjustedY);
      } else {
        // 선택되지 않은 테이블만 독립적으로 이동
        const parentRect =
          tableRef.current.parentElement.getBoundingClientRect();
        const newX = e.clientX - parentRect.left - offsetRef.current.x;
        const newY = e.clientY - parentRect.top - offsetRef.current.y;

        onUpdate({
          id,
          x: newX,
          y: newY,
          tableName: localName,
          description: localDesc,
          columns: localColumns,
        });
      }
    };

    const handleMouseUp = () => {
      draggingRef.current = false;

      const prev = tablePositionsRef?.current?.[id];
      const hasMoved =
        prev &&
        (Math.round(prev.x) !== Math.round(x) ||
          Math.round(prev.y) !== Math.round(y));

      if (isSelected && hasMoved) {
        patchTable(erdId, id, {
          pos_x: Math.round(x),
          pos_y: Math.round(y),
        }).catch((err) => {
          console.error("🛑 테이블 위치 저장 실패:", err);
        });

        if (onSnapshotRequest) {
          onSnapshotRequest();
        }

        // ✅ 이동 후 좌표 업데이트까지는 중앙(ErdCanvas)에서 따로 처리됨
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    id,
    x,
    y,
    localName,
    localDesc,
    localColumns,
    onUpdate,
    isSelected,
    erdId,
    onColumnPositionUpdate,
    onDragMove,
    onSnapshotRequest,
    zoom,
    panOffset.x,
    panOffset.y,
    tablePositionsRef,
  ]);

  const handleAddColumn = async () => {
    try {
      const newColumn = await createColumn(id); // id = 테이블 ID

      setLocalColumns((prev) => {
        const updated = [
          ...prev,
          {
            ...newColumn,
            id: newColumn.column_id ?? `temp-${Date.now()}`, // fallback ID
            name: newColumn.name || "",
            dataType: newColumn.data_type || "",
            isNullable: !newColumn.is_not_null,
            isPrimaryKey: newColumn.is_primary,
            defaultValue: newColumn.default_value || "",
            comment: newColumn.description || "",
          },
        ];

        // ✅ 스냅샷 저장
        onSnapshotRequest?.();
        return updated;
      });
    } catch (err) {
      console.error("컬럼 생성 실패:", err);
      alert("컬럼 생성 중 오류가 발생했습니다.");
    }
  };

  const handleColumnChange = (index, key, value) => {
    const updated = [...localColumns];
    updated[index][key] = value;
    setLocalColumns(updated);

    onUpdate({
      id,
      x,
      y,
      tableName: localName,
      description: localDesc,
      columns: updated,
    });
  };
  const handleDeleteColumn = async (index) => {
    const columnId = localColumns[index]?.id;
    if (!columnId) return;

    try {
      await deleteColumn(columnId);
      setLocalColumns((prev) => {
        const updated = prev.filter((_, i) => i !== index);

        // ✅ 스냅샷 저장
        onSnapshotRequest?.();
        return updated;
      });
    } catch (err) {
      console.error("컬럼 삭제 실패:", err);
      alert("컬럼 삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div
      ref={tableRef}
      className={`erd-table-box absolute bg-[#1e1e2e] text-white border border-blue-400 rounded-md shadow-md w-[480px] px-3 py-2 select-none ${
        isSelected ? "ring-2 ring-yellow-300" : ""
      }`}
      data-id={id}
      style={{ top: y, left: x }}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
      onMouseDown={(e) => {
        e.stopPropagation(); // ✅ 캔버스 드래그 시작 방지
      }}
      // ✅ 아예 제거하거나 다음처럼 조건화
      onMouseUp={undefined}
    >
      <div
        className="flex justify-end mb-1 cursor-move"
        onMouseDown={handleMouseDown}
      >
        <button
          onClick={handleAddColumn}
          className="text-white hover:text-blue-300 text-sm mr-2"
        >
          <FaPlus size={12} />
        </button>
        <button
          onClick={async () => {
            await onDelete?.(); // ❗ 삭제 완료 대기
            onSnapshotRequest?.(); // ✅ 삭제된 이후 스냅샷 저장
          }}
          className="text-white hover:text-red-400 text-sm"
        >
          <FaTimes size={12} />
        </button>
      </div>
      <div className="flex items-center h-[28px] gap-0">
        <input
          className="bg-transparent border-b border-transparent focus:border-blue-400 focus:outline-none transition duration-150 text-sm font-medium placeholder:text-gray-400 h-full leading-[1.4] pl-2"
          style={{ width: "30%" }}
          placeholder="table"
          value={localName}
          onChange={(e) => {
            const newName = e.target.value;
            setLocalName(newName);
            handleTableFieldChange("tableName", newName);
          }}
          onBlur={() => handleTableFieldBlur("tableName")}
        />
        <input
          className="bg-transparent border-b border-transparent focus:border-blue-400 focus:outline-none transition duration-150 text-sm placeholder:text-gray-500 h-full leading-[1.4] pl-2"
          style={{ width: "30%" }}
          placeholder="description"
          value={localDesc}
          onChange={(e) => {
            const newDesc = e.target.value;
            setLocalDesc(newDesc);
            handleTableFieldChange("description", newDesc);
          }}
          onBlur={() => handleTableFieldBlur("tableName")}
        />
      </div>

      <div className="mt-2">
        {localColumns.map((col, index) => (
          <ErdColumnRow
            key={`col-${col.id ?? index}`}
            column={col}
            index={index}
            onChange={handleColumnChange}
            onDelete={handleDeleteColumn}
            onTogglePrimaryKey={handleTogglePK}
            onDragStart={() => startDrag(index)}
            onDragOver={() => setHoverIndex(index)}
            onDrop={() => {
              handleReorderColumns(dragIndex, index);
              endDrag();
            }}
            onDragEnd={endDrag}
            isDragging={dragIndex === index}
            isHovering={hoverIndex === index}
            onPositionUpdate={(colId, el) => handleColumnPosUpdate(colId, el)}
            onClick={() => {
              onColumnClick?.(col.id);
            }}
            isRelationMode={isAddingRelation}
            isRelationHover={isAddingRelation && hoveredColumnId === col.id}
            setHoveredColumnId={setHoveredColumnId}
            onSnapshotRequest={onSnapshotRequest}
          />
        ))}
      </div>
    </div>
  );
};

export default ErdTableBox;
