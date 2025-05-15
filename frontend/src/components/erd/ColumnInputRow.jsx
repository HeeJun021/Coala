import React, { useState } from "react";
import { FaKey, FaTimes } from "react-icons/fa";

const ColumnInputRow = ({ column, index, onChange, onDelete, onTogglePrimaryKey }) => {
  const [focusedField, setFocusedField] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [showPkMenu, setShowPkMenu] = useState(false);

  const handleRightClick = (e) => {
    e.preventDefault();
    setShowPkMenu(true);
  };

  const handlePkSelect = () => {
    onTogglePrimaryKey(index);
    setShowPkMenu(false);
  };

  return (
    <div
      className="flex items-center space-x-3 relative px-2 py-1 rounded hover:bg-[#2f2f40]"
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => {
        setShowDelete(false);
        setShowPkMenu(false);
      }}
      onContextMenu={handleRightClick}
    >
      {/* 🔑 PK 아이콘 */}
      <div className="w-4">
        {column.isPrimaryKey && <FaKey className="text-yellow-400" />}
      </div>

      {/* 컬럼명 */}
      <input
        type="text"
        value={column.name}
        onFocus={() => setFocusedField("name")}
        onBlur={() => setFocusedField(null)}
        onChange={(e) => onChange(index, "name", e.target.value)}
        placeholder="column"
        className={`bg-transparent text-sm w-28 placeholder-gray-400 focus:outline-none border-b ${
          focusedField === "name" ? "border-yellow-400" : "border-transparent"
        }`}
      />

      {/* 데이터 타입 */}
      <select
        value={column.dataType}
        onFocus={() => setFocusedField("type")}
        onBlur={() => setFocusedField(null)}
        onChange={(e) => onChange(index, "dataType", e.target.value)}
        className={`bg-transparent text-sm w-28 focus:outline-none border-b ${
          focusedField === "type" ? "border-yellow-400" : "border-transparent"
        }`}
      >
        <option value="">선택</option>
        <option value="INT">INT</option>
        <option value="VARCHAR">VARCHAR</option>
        <option value="BOOLEAN">BOOLEAN</option>
        <option value="DATE">DATE</option>
        <option value="TEXT">TEXT</option>
        <option value="TIMESTAMP">TIMESTAMP</option>
      </select>

      {/* NULL 허용 여부 */}
      <div
        onClick={() => onChange(index, "isNullable", !column.isNullable)}
        className="cursor-pointer text-sm w-10 text-center text-gray-300 hover:text-white select-none"
        title="NULL 설정"
      >
        {column.isNullable ? "NULL" : "N-N"}
      </div>

      {/* 기본값 */}
      <input
        type="text"
        value={column.defaultValue}
        onFocus={() => setFocusedField("default")}
        onBlur={() => setFocusedField(null)}
        onChange={(e) => onChange(index, "defaultValue", e.target.value)}
        placeholder="default"
        className={`bg-transparent text-sm w-24 placeholder-gray-400 focus:outline-none border-b ${
          focusedField === "default" ? "border-yellow-400" : "border-transparent"
        }`}
      />

      {/* 설명 */}
      <input
        type="text"
        value={column.comment}
        onFocus={() => setFocusedField("comment")}
        onBlur={() => setFocusedField(null)}
        onChange={(e) => onChange(index, "comment", e.target.value)}
        placeholder="description"
        className={`bg-transparent text-sm w-40 placeholder-gray-400 focus:outline-none border-b ${
          focusedField === "comment" ? "border-yellow-400" : "border-transparent"
        }`}
      />

      {/* ❌ 삭제 버튼 */}
      {showDelete && (
        <button
          onClick={() => onDelete(index)}
          className="text-red-400 hover:text-red-600 absolute right-2"
        >
          <FaTimes size={12} />
        </button>
      )}

      {/* 우클릭 PK 설정 메뉴 */}
      {showPkMenu && (
        <div className="absolute top-7 left-2 bg-[#2a2a3c] border border-gray-600 rounded shadow px-3 py-1 text-sm cursor-pointer hover:bg-gray-700 z-10">
          <div onClick={handlePkSelect} className="text-yellow-400 flex items-center gap-1">
            <FaKey /> Primary Key
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnInputRow;
