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
  isAddingRelation,
  selectedColumnId,
}) => {
  const [localName, setLocalName] = useState(tableName || "");
  const [localDesc, setLocalDesc] = useState(description || "");
  const [localColumns, setLocalColumns] = useState(columns || []);

  const offsetRef = useRef({ x: 0, y: 0 });
  const tableRef = useRef(null);
  const draggingRef = useRef(false);

  

  const { dragIndex, hoverIndex, setHoverIndex, startDrag, endDrag } =
    useDragColumn();

  const handleReorderColumns = (from, to) => {
    if (from === to || from === null || to === null) return;
    const newCols = [...localColumns];
    const [moved] = newCols.splice(from, 1);
    newCols.splice(to, 0, moved);
    setLocalColumns(newCols);
  };

  // 개별 컬럼 위치 갱신 콜백
  const handleColumnPosUpdate = (colName, pos) => {
    // 바로 상위로 전달
    onColumnPositionUpdate?.(id, { [colName]: pos });
  };

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

  const handleTogglePK = (index) => {
    const updated = [...localColumns];
    updated[index].isPrimaryKey = !updated[index].isPrimaryKey;
    setLocalColumns(updated);
  };

  return (
    <div
      ref={tableRef}
      className="absolute bg-[#2a2a3d] text-white border border-yellow-300 rounded-md shadow-md w-[300px] select-none"
      style={{ top: y, left: x }}
      onClick={(e) => {
        e.stopPropagation(); // 관계 연결 외에 캔버스 클릭과 충돌 방지
        if (onClick) onClick(); // ✅ 상위 함수 호출
      }}
    >
      {/* 테이블 상단 */}
      <div
        className="flex justify-between items-center p-2 border-b border-yellow-300 cursor-move"
        onMouseDown={handleMouseDown}
      >
        <div className="flex flex-col">
          <input
            className="bg-transparent border-b border-yellow-400 focus:outline-none text-lg font-bold"
            placeholder="테이블 이름"
            value={localName}
            onChange={(e) => {
              const newName = e.target.value;
              setLocalName(newName);
              onUpdate({
                id,
                x,
                y,
                tableName: newName,
                description: localDesc,
                columns: localColumns,
              });
            }}
          />

          <input
            className="bg-transparent border-b border-gray-400 text-sm mt-1 focus:outline-none"
            placeholder="설명"
            value={localDesc}
            onChange={(e) => {
              const newDesc = e.target.value;
              setLocalDesc(newDesc);
              onUpdate({
                id,
                x,
                y,
                tableName: localName,
                description: newDesc,
                columns: localColumns,
              });
            }}
          />
        </div>
        <div className="flex items-center space-x-2 ml-2">
          <button onClick={handleAddColumn}>
            <FaPlus />
          </button>
          <button onClick={onDelete}>
            <FaTimes />
          </button>
        </div>
      </div>
      {/* 컬럼 영역 */}

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
          onPositionUpdate={handleColumnPosUpdate}
          onClick={() => {
            onColumnClick?.(id, col.name);
          }}
          isSelectable={isAddingRelation}
          isSelected={selectedColumnId === `${id}.${col.name}`}
        />
      ))}
    </div>
  );
};

export default ErdTableBox;
