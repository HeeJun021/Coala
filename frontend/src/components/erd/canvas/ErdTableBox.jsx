import React, { useState, useRef, useEffect } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";
import ErdColumnRow from "./ErdColumnRow";
import { useDragColumn } from "../drag/useDragColumn";

import { patchTable } from "../../../api/erd/tableApi"; // 경로 맞게 수정
import { createColumn, deleteColumn } from "../../../api/erd/columnApi"; // 실제 경로 맞게 수정

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
}) => {
  const [localName, setLocalName] = useState(tableName || "");
  const [localDesc, setLocalDesc] = useState(description || "");
  const [localColumns, setLocalColumns] = useState(() => columns || []);

  const offsetRef = useRef({ x: 0, y: 0 });
  const tableRef = useRef(null);

  const draggingRef = useRef(false);
  const columnPositionsRef = useRef({});

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
    const updateData = generateTableUpdateData(key, value);

    patchTable(erdId, id, updateData).catch((err) => {
      console.error("테이블 수정 실패", err);
    });

    // 상태 업데이트 및 렌더링용 onUpdate 호출
    onUpdate({
      id,
      x,
      y,
      tableName: key === "tableName" ? value : localName,
      description: key === "description" ? value : localDesc,
      columns: localColumns,
    });
  };

  const handleReorderColumns = (from, to) => {
    if (from === to || from === null || to === null) return;
    const newCols = [...localColumns];
    const [moved] = newCols.splice(from, 1);
    newCols.splice(to, 0, moved);
    setLocalColumns(newCols);
  };

  // ✅ 컬럼 위치 계산 (컬럼 DOM 요소 기준이 아닌 테이블 기준으로 조정)
  const handleColumnPosUpdate = (colId, el) => {
    if (!tableRef.current || !el) return;

    const canvasRect = document
      .getElementById("erd-canvas")
      ?.getBoundingClientRect();
    const tableRect = tableRef.current.getBoundingClientRect();
    const colRect = el.getBoundingClientRect();
    if (!canvasRect) return;

    const pos = {
      left: tableRect.left - canvasRect.left, // 테이블 왼쪽 끝
      right: tableRect.right - canvasRect.left, // 테이블 오른쪽 끝
      y: colRect.top - canvasRect.top + colRect.height / 2, // 컬럼 중간
    };

    columnPositionsRef.current[colId] = pos;
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
  }, [id, onColumnPositionUpdate]);

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
    // ✅ 기준점 강제 갱신 요청 이벤트 (선택된 테이블을 움직이려 할 때마다)
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
      const parentRect = tableRef.current.parentElement.getBoundingClientRect();
      const newX = e.clientX - parentRect.left - offsetRef.current.x;
      const newY = e.clientY - parentRect.top - offsetRef.current.y;

      const isNowSelected = isSelected;

      if (isNowSelected && onDragMove) {
        // ✅ 마우스 기준 좌표 전달
        const mouseX = e.clientX - parentRect.left;
        const mouseY = e.clientY - parentRect.top;
        onDragMove(mouseX, mouseY);
      } else {
        // ✅ 단일 이동
        onUpdate({
          id,
          x: newX,
          y: newY,
          tableName: localName,
          description: localDesc,
          columns: localColumns,
        });
      }

      setTimeout(() => {
        if (onColumnPositionUpdate && columnPositionsRef.current) {
          onColumnPositionUpdate(id, { ...columnPositionsRef.current });
        }
      }, 0);
    };

    const handleMouseUp = () => {
      draggingRef.current = false;

      // ✅ 위치 서버에 저장
      if (isSelected && x !== undefined && y !== undefined) {
        patchTable(erdId, id, { pos_x: x, pos_y: y }).catch((err) => {
          console.error("🛑 테이블 위치 저장 실패:", err);
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, x, y, localName, localDesc, localColumns, onUpdate, isSelected]);

  const handleAddColumn = async () => {
    try {
      const newColumn = await createColumn(id); // id는 테이블 ID (props)

      setLocalColumns((prev) => [
        ...prev,
        {
          ...newColumn,
          id: newColumn.column_id, // 프론트 전용 id
          name: newColumn.name || "",
          dataType: newColumn.data_type || "",
          isNullable: !newColumn.is_not_null,
          isPrimaryKey: newColumn.is_primary,
          defaultValue: newColumn.default_value || "",
          comment: newColumn.description || "",
        },
      ]);
    } catch (err) {
      console.error("컬럼 생성 실패:", err);
      alert("컬럼 생성 중 오류가 발생했습니다.");
    }
  };

  const handleColumnChange = (index, key, value) => {
    const updated = [...localColumns];
    updated[index][key] = value;
    setLocalColumns(updated);
  };

  const handleDeleteColumn = async (index) => {
    const columnId = localColumns[index]?.id;
    if (!columnId) return;

    try {
      await deleteColumn(columnId); // 서버에 삭제 요청
      setLocalColumns((prev) => prev.filter((_, i) => i !== index)); // 상태 갱신
    } catch (err) {
      console.error("컬럼 삭제 실패:", err);
      alert("컬럼 삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div
      ref={tableRef}
      className={`absolute bg-[#1e1e2e] text-white border border-blue-400 rounded-md shadow-md w-[440px] px-3 py-2 select-none ${
        isSelected ? "ring-2 ring-yellow-300" : ""
      }`}
      style={{ top: y, left: x }}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
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
          onClick={onDelete}
          className="text-white hover:text-red-400 text-sm"
        >
          <FaTimes size={12} />
        </button>
      </div>

      <div className="flex items-center justify-start gap-3">
        <input
          className="bg-transparent border-b border-transparent focus:border-blue-400 focus:outline-none transition duration-150 text-sm font-medium placeholder:text-gray-400 w-[180px]"
          placeholder="table"
          value={localName}
          onChange={(e) => {
            const newName = e.target.value;
            setLocalName(newName);
            handleTableFieldChange("tableName", newName);
          }}
        />
        <input
          className="bg-transparent border-b border-transparent focus:border-blue-400 focus:outline-none transition duration-150 text-sm placeholder:text-gray-500 w-[180px]"
          placeholder="comment"
          value={localDesc}
          onChange={(e) => {
            const newDesc = e.target.value;
            setLocalDesc(newDesc);
            handleTableFieldChange("description", newDesc);
          }}
        />
      </div>

      <div className="mt-2">
        {localColumns.map((col, index) => (
          <ErdColumnRow
            key={col.id}
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
          />
        ))}
      </div>
    </div>
  );
};

export default ErdTableBox;
