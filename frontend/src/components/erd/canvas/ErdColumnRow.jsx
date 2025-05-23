import React, { useState, useRef, useEffect } from "react";
import { patchColumn } from "../../../api/erd/columnApi";
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
  const [pkMenuPos, setPkMenuPos] = useState({ x: 0, y: 0 });

  const ref = useRef(null);

  const handleRightClick = (e) => {
    e.preventDefault();
    setShowPkMenu(true);
    setPkMenuPos({ x: e.clientX, y: e.clientY });
  };

  const generateUpdateData = (key, value) => {
    switch (key) {
      case "name":
        return { name: value };
      case "dataType":
        return { data_type: value };
      case "defaultValue":
        return { default_value: value };
      case "comment":
        return { description: value };
      case "isNullable":
        return { is_not_null: !value };
      default:
        return {};
    }
  };

  const handleInputChange = (key, value) => {
    onChange(index, key, value);

    if (!column.column_id) return;

    const updateData = generateUpdateData(key, value); // ← 단일 필드만 포함
    patchColumn(column.column_id, updateData).catch((err) => {
      console.error("컬럼 즉시 수정 실패", err);
    });
  };

  useEffect(() => {
    if (ref.current && onPositionUpdate && column?.id) {
      onPositionUpdate(column.id, ref.current);
    }
  }, [column.id, onPositionUpdate]);

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
        onClick={() => onClick?.(column.id)}
      >
        <div className="w-[20px] flex justify-center items-center">
          <FaKey
            className={`text-yellow-300 transition-opacity duration-150 ${
              column.isPrimaryKey ? "opacity-100" : "opacity-0"
            }`}
            size={12}
          />
        </div>

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
