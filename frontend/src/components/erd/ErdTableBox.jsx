import React, { useState, useRef, useEffect } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";
import ErdColumnRow from "./ErdColumnRow";
import { v4 as uuidv4 } from "uuid";
import { useDragColumn } from "./drag/useDragColumn";

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

    const canvasRect = document.getElementById("erd-canvas")?.getBoundingClientRect();
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
    draggingRef.current = true;
    const rect = tableRef.current.getBoundingClientRect();
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    e.stopPropagation();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!draggingRef.current) return;
      const parentRect = tableRef.current.parentElement.getBoundingClientRect();
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

      setTimeout(() => {
        if (onColumnPositionUpdate && columnPositionsRef.current) {
          onColumnPositionUpdate(id, { ...columnPositionsRef.current });
        }
      }, 0);
    };

    const handleMouseUp = () => {
      draggingRef.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, localName, localDesc, localColumns, onUpdate]);

  const handleAddColumn = () => {
    setLocalColumns((prev) => [
      ...prev,
      {
        id: uuidv4(),
        name: "",
        dataType: "",
        isNullable: false,
        isPrimaryKey: false,
        defaultValue: "",
        comment: "",
      },
    ]);
  };

  const handleColumnChange = (index, key, value) => {
    const updated = [...localColumns];
    updated[index][key] = value;
    setLocalColumns(updated);
  };

  const handleDeleteColumn = (index) => {
    setLocalColumns((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      ref={tableRef}
      className="absolute bg-[#1e1e2e] text-white border border-blue-400 rounded-md shadow-md w-[440px] px-3 py-2 select-none"
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
            onUpdate({ id, x, y, tableName: newName, description: localDesc, columns: localColumns });
          }}
        />
        <input
          className="bg-transparent border-b border-transparent focus:border-blue-400 focus:outline-none transition duration-150 text-sm placeholder:text-gray-500 w-[180px]"
          placeholder="comment"
          value={localDesc}
          onChange={(e) => {
            const newDesc = e.target.value;
            setLocalDesc(newDesc);
            onUpdate({ id, x, y, tableName: localName, description: newDesc, columns: localColumns });
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
