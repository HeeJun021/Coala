import React, { useState, useRef, useEffect } from "react";
import { patchColumn, setColumnPrimaryKey } from "../../../api/erd/columnApi";
import { FaKey, FaTimes } from "react-icons/fa";
import { Check } from "lucide-react";

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
  isRelationMode,
  isRelationHover,
  setHoveredColumnId,
  onSnapshotRequest,
  isAddingRelation,
  originalColumn,
}) => {
  const [showDelete, setShowDelete] = useState(false);
  const [showPkMenu, setShowPkMenu] = useState(false);
  const [pkMenuPos, setPkMenuPos] = useState({ x: 0, y: 0 });

  const ref = useRef(null);

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
  // ✅ onChange에서는 상태만 변경
  const handleInputChange = (key, value) => {
    onChange(index, key, value);
  };

  // ✅ onBlur에서만 PATCH 호출
  const handleInputBlur = async (key, value) => {
    if (!column.column_id) return;

    const updateData = generateUpdateData(key, value);
    console.log("📡 PATCH 전송:", updateData);
    if (!updateData || Object.keys(updateData).length === 0) return;

    try {
      await patchColumn(column.column_id, updateData);
      onChange(index, key, value); // PATCH 성공 후도 강제 반영
      onSnapshotRequest?.();
    } catch (err) {
      console.error("PATCH 실패:", err.response?.data || err);
    }
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = e.currentTarget.offsetParent.getBoundingClientRect();

    setPkMenuPos({
      x: rect.left - parentRect.left + 10,
      y: rect.top - parentRect.top + rect.height + 4,
    });

    setShowPkMenu(true);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".pk-menu")) setShowPkMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (ref.current && onPositionUpdate && column?.id) {
      onPositionUpdate(column.id, ref.current);
    }
  }, [column.id, onPositionUpdate]);

  // ✅ PK / FK 안전 처리 (isPrimaryKey / isForeignKey 또는 is_primary / is_foreign 모두 대응)
  const isPK = column.isPrimaryKey ?? column.is_primary ?? false;
  const isFK = column.isForeignKey ?? column.is_foreign ?? false;

  return (
    <>
      <div
        ref={ref}
        data-column-id={column.id}
        className={`relative group flex items-center px-2 py-1 pr-8 rounded-sm select-none space-x-2
        ${isRelationHover ? "bg-blue-500/30 ring-2 ring-blue-300" : ""}
        ${isDragging ? "opacity-50" : ""}
        cursor-grab transition duration-150`}
        style={{
          backgroundColor: isHovering ? "#3a3a4d" : "transparent",
          opacity: isDragging ? 0.5 : 1,
          cursor: "grab",
          lineHeight: "24px", // ✅ 추가
        }}
        draggable
        onDragStart={onDragStart}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver();
        }}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        onMouseEnter={() => {
          setShowDelete(true);
          if (isRelationMode) setHoveredColumnId?.(column.id);
        }}
        onMouseLeave={() => {
          setShowDelete(false);
          if (isRelationMode) setHoveredColumnId?.(null);
        }}
        onContextMenu={handleRightClick}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(column.id);
        }}
      >
        {isAddingRelation && (
          <div
            className="absolute top-0 left-0 w-full h-full z-20"
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(column.id);
            }}
          />
        )}

        <div
          className="w-[20px] flex justify-center items-center"
          style={{ height: "24px" }}
        >
          {isPK && <FaKey className="text-yellow-300 mr-1" size={12} />}
          {isFK && <FaKey className="text-red-400" size={12} />}
        </div>

        <div className="flex items-center space-x-2 flex-grow">
          <input
            className="bg-transparent border-b border-transparent focus:border-blue-400 focus:outline-none transition duration-150 text-sm text-white placeholder:text-gray-500 pl-2"
            style={{
              width: "70px",
              height: "24px",
              lineHeight: "22px",
              padding: "0",
              margin: "0",
              verticalAlign: "middle",
            }}
            placeholder="column"
            value={column.name ?? ""}
            onChange={(e) => handleInputChange("name", e.target.value)}
            onBlur={(e) => handleInputBlur("name", e.target.value)}
          />

          <select
            className="select-dark bg-transparent border-b border-transparent focus:border-blue-400 focus:outline-none transition duration-150 text-sm text-white pl-2"
            style={{
              width: "100px", // ✅ TIMESTAMP 길이에 맞춰 고정
              height: "24px",
              lineHeight: "22px",
              padding: "0",
              margin: "0",
              verticalAlign: "middle",
              textAlign: "center",
              textAlignLast: "center", // ✅ 선택된 항목도 가운데 정렬
            }}
            value={column.dataType ?? ""}
            onChange={(e) => handleInputChange("dataType", e.target.value)}
            onBlur={(e) => handleInputBlur("dataType", e.target.value)}
          >
            <option value="" disabled className="text-gray-400">
              type
            </option>
            {[
              "INT",
              "BIGINT",
              "VARCHAR",
              "TEXT",
              "BOOLEAN",
              "DATE",
              "TIMESTAMP",
              "DECIMAL",
              "FLOAT",
              "CHAR",
            ].map((type) => (
              <option key={type} value={type} className="text-black">
                {type}
              </option>
            ))}
          </select>

          <div
            className="cursor-pointer text-xs w-[50px] text-center text-gray-300 hover:text-white"
            onClick={() => {
              const newValue = !column.isNullable;
              handleInputChange("isNullable", newValue);
              handleInputBlur("isNullable", newValue);
            }}
            style={{ lineHeight: "22px", height: "24px" }}
          >
            {column.isNullable ? "NULL" : "N-N"}
          </div>

          <input
            className="bg-transparent border-b border-transparent focus:border-blue-400 focus:outline-none transition duration-150 text-sm text-white placeholder:text-gray-500 pl-2"
            style={{
              width: "70px",
              height: "24px",
              lineHeight: "22px",
              padding: "0",
              margin: "0",
              verticalAlign: "middle",
            }}
            placeholder="default"
            value={column.defaultValue ?? ""}
            onChange={(e) => handleInputChange("defaultValue", e.target.value)}
            onBlur={(e) => handleInputBlur("defaultValue", e.target.value)}
          />

          <input
            className="bg-transparent border-b border-transparent focus:border-blue-400 focus:outline-none transition duration-150 text-sm text-white placeholder:text-gray-500 pl-2"
            style={{
              width: "90px",
              height: "24px",
              lineHeight: "22px",
              padding: "0",
              margin: "0",
              verticalAlign: "middle",
            }}
            placeholder="description"
            value={column.comment ?? ""}
            onChange={(e) => handleInputChange("comment", e.target.value)}
            onBlur={(e) => handleInputBlur("comment", e.target.value)}
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
          className="absolute z-50 min-w-[140px] bg-[#1f2233] border border-[#2b2e42] rounded-lg shadow-xl text-sm"
          style={{ top: pkMenuPos.y, left: pkMenuPos.x }}
        >
          <button
            className="flex items-center justify-between gap-2 px-4 py-[6px] w-full hover:bg-[#2c2f45] text-gray-100 rounded-lg transition"
            onClick={async () => {
              try {
                await setColumnPrimaryKey(column.column_id, !isPK);
                onTogglePrimaryKey(column.id);
                setShowPkMenu(false);
              } catch (error) {
                console.error("PK 설정 실패:", error);
                alert("PK 설정에 실패했습니다.");
              }
            }}
          >
            <div className="flex items-center gap-2">
              <FaKey className="w-3.5 h-3.5 text-yellow-400" />
              PK 설정
            </div>
            {isPK && <Check className="w-4 h-4 text-green-400" />}
          </button>
        </div>
      )}
    </>
  );
};

export default ErdColumnRow;
