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
  onPositionUpdate,
  onClick,
}) => {
  const [showDelete, setShowDelete] = useState(false);
  const [showPkMenu, setShowPkMenu] = useState(false);
  const [pkMenuPos, setPkMenuPos] = useState({ x: 0, y: 0 }); // ✅ PK 메뉴 위치
  const ref = useRef(null);

  const handleRightClick = (e) => {
    e.preventDefault();
    setShowPkMenu(true);
    setPkMenuPos({ x: e.clientX, y: e.clientY }); // ✅ 마우스 위치 저장
  };

  const handleInputChange = (key, value) => {
    onChange(index, key, value);
  };

  useEffect(() => {
    let frameId;

    const updatePosition = () => {
      if (!ref.current || !column?.name || !onPositionUpdate) return;

      const rect = ref.current.getBoundingClientRect();
      const canvasRect = document
        .getElementById("erd-canvas")
        ?.getBoundingClientRect();
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

  // ✅ 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest(".pk-menu")) return;
      setShowPkMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* 컬럼 줄 */}
      <div
        ref={ref}
        className="relative group flex items-center px-2 py-1 pr-8 rounded-sm select-none space-x-2"
        draggable
        onDragStart={onDragStart}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver();
        }}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        onMouseEnter={() => setShowDelete(true)}
        onMouseLeave={() => setShowDelete(false)}
        onContextMenu={handleRightClick}
        style={{
          backgroundColor: isHovering ? "#3a3a4d" : "transparent",
          opacity: isDragging ? 0.5 : 1,
          cursor: "grab",
        }}
        onClick={() => onClick?.()}
      >
        {/* 🔑 PK 아이콘 */}
        <div className="w-[20px] flex justify-center items-center">
          <FaKey
            className={`text-yellow-300 transition-opacity duration-150 ${
              column.isPrimaryKey ? "opacity-100" : "opacity-0"
            }`}
            size={12}
          />
        </div>

        {/* 입력 필드 */}
        <div className="flex items-center space-x-1 flex-grow">
          <input
            className="bg-transparent border-b border-transparent focus:border-blue-400 focus:outline-none transition duration-150 w-[70px] text-sm text-white placeholder:text-gray-500"
            placeholder="column"
            value={column.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
          />
          <input
            className="bg-transparent border-b border-transparent focus:border-blue-400 focus:outline-none transition duration-150 w-[70px] text-sm text-white placeholder:text-gray-500"
            placeholder="type"
            value={column.dataType}
            onChange={(e) => handleInputChange("dataType", e.target.value)}
          />
          <div
            className="cursor-pointer text-xs w-[50px] text-center text-gray-300 hover:text-white"
            onClick={() => handleInputChange("isNullable", !column.isNullable)}
          >
            {column.isNullable ? "NULL" : "N-N"}
          </div>
          <input
            className="bg-transparent border-b border-transparent focus:border-blue-400 focus:outline-none transition duration-150 w-[70px] text-sm text-white placeholder:text-gray-500"
            placeholder="default"
            value={column.defaultValue}
            onChange={(e) => handleInputChange("defaultValue", e.target.value)}
          />
          <input
            className="bg-transparent border-b border-transparent focus:border-blue-400 focus:outline-none transition duration-150 w-[70px] text-sm text-white placeholder:text-gray-500"
            placeholder="desc"
            value={column.comment}
            onChange={(e) => handleInputChange("comment", e.target.value)}
          />
        </div>

        {/* ❌ 삭제 버튼 */}
        <div className="absolute top-1 right-1 z-10">
          <button
            className={`text-gray-400 hover:text-red-500 transition-opacity duration-150 ${
              showDelete ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => onDelete(index)}
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* 🔑 PK 설정 메뉴 (마우스 위치 기준으로 띄움) */}
      {showPkMenu && (
        <div
          className="fixed z-50 pk-menu bg-[#3a3a4d] border border-gray-600 text-sm rounded px-2 py-1 cursor-pointer shadow"
          style={{ top: pkMenuPos.y, left: pkMenuPos.x }}
          onClick={() => {
            console.log("✅ PK 설정 요청:", column.id);
            onTogglePrimaryKey(column.id);
            setShowPkMenu(false);
          }}
        >
          🔑 PK 설정
        </div>
      )}
    </>
  );
};

export default ErdColumnRow;
