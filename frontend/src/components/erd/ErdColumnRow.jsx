import React, { useState, useEffect, useRef } from "react";
import { FaKey, FaTimes } from "react-icons/fa";

const ErdColumnRow = ({
  column,
  index,
  onChange,
  onDelete,
  onTogglePrimaryKey,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isHovering,
  onPositionUpdate, // ✅ 추가: 부모에게 위치 전달
  onClick, // ✅ 추가
}) => {
  const [showDelete, setShowDelete] = useState(false);
  const [showPkMenu, setShowPkMenu] = useState(false);
  const ref = useRef(null); // ✅ 컬럼 DOM 참조용

  const handleRightClick = (e) => {
    e.preventDefault();
    setShowPkMenu(true);
  };

  const handleInputChange = (key, value) => {
    onChange(index, key, value);
  };

  // ✅ 마운트/업데이트 시 위치 계산
  useEffect(() => {
  let frameId;

  const updatePosition = () => {
    if (!ref.current || !column?.name || !onPositionUpdate) return;

    const rect = ref.current.getBoundingClientRect();
    const canvasRect = document.getElementById("erd-canvas")?.getBoundingClientRect();
    if (!canvasRect) return;

    onPositionUpdate(column.name, {
      left: rect.left - canvasRect.left,
      right: rect.left - canvasRect.left + rect.width,
      y: rect.top - canvasRect.top + rect.height / 2,
    });

    frameId = requestAnimationFrame(updatePosition);
  };

  frameId = requestAnimationFrame(updatePosition);

  return () => cancelAnimationFrame(frameId);
}, [column.name, onPositionUpdate]);



  return (
    <div
      ref={ref} // ✅ DOM 위치 추적을 위한 ref
      className={`flex items-center space-x-2 px-2 py-1 relative group rounded-sm select-none`}
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => {
        setShowDelete(false);
        setShowPkMenu(false);
      }}
      onContextMenu={handleRightClick}
      style={{
        backgroundColor: isHovering ? "#3a3a4d" : "transparent",
        opacity: isDragging ? 0.5 : 1,
        cursor: "grab",
      }}
      onClick={() => onClick?.()} // ✅ 추가
    >
      {column.isPrimaryKey && <FaKey className="text-yellow-300 mr-1" />}

      <input
        className="bg-transparent border-b border-gray-600 w-[70px] text-sm text-white focus:outline-none"
        placeholder="column"
        value={column.name}
        onChange={(e) => handleInputChange("name", e.target.value)}
      />
      <input
        className="bg-transparent border-b border-gray-600 w-[60px] text-sm text-white focus:outline-none"
        placeholder="type"
        value={column.dataType}
        onChange={(e) => handleInputChange("dataType", e.target.value)}
      />
      <div
        className="cursor-pointer text-xs w-[30px] text-center"
        onClick={() => handleInputChange("isNullable", !column.isNullable)}
      >
        {column.isNullable ? "NULL" : "N-N"}
      </div>
      <input
        className="bg-transparent border-b border-gray-600 w-[50px] text-sm text-white focus:outline-none"
        placeholder="default"
        value={column.defaultValue}
        onChange={(e) => handleInputChange("defaultValue", e.target.value)}
      />
      <input
        className="bg-transparent border-b border-gray-600 w-[60px] text-sm text-white focus:outline-none"
        placeholder="desc"
        value={column.comment}
        onChange={(e) => handleInputChange("comment", e.target.value)}
      />

      {showDelete && (
        <button
          className="text-gray-400 hover:text-red-500 ml-2"
          onClick={() => onDelete(index)}
        >
          <FaTimes />
        </button>
      )}

      {showPkMenu && (
        <div
          className="absolute top-7 left-2 bg-[#3a3a4d] border border-gray-600 text-sm rounded px-2 py-1 z-50 cursor-pointer"
          onClick={() => onTogglePrimaryKey(index)}
        >
          🔑 PK 설정
        </div>
      )}
    </div>
  );
};

export default ErdColumnRow;
