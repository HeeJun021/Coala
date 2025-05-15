import React, { useState } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";
import ColumnInputRow from "./ColumnInputRow";

const ErdTableInputBox = ({ x, y, onConfirm, onCancel }) => {
  const [tableName, setTableName] = useState("");
  const [description, setDescription] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  const [columns, setColumns] = useState([]);
  const [showColumns, setShowColumns] = useState(false);

  const handleAddColumn = () => {
    setShowColumns(true);
    setColumns((prev) => [
      ...prev,
      {
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
    const newColumns = [...columns];
    newColumns[index][key] = value;
    setColumns(newColumns);
  };

  const handleDeleteColumn = (index) => {
    const newColumns = [...columns];
    newColumns.splice(index, 1);
    setColumns(newColumns);
  };

  const handleTogglePrimaryKey = (index) => {
    const newColumns = [...columns];
    newColumns[index].isPrimaryKey = !newColumns[index].isPrimaryKey;
    setColumns(newColumns);
  };

  const handleConfirm = () => {
    if (!tableName.trim()) {
      alert("테이블 이름을 입력해주세요.");
      return;
    }

    onConfirm({
      name: tableName.trim(),
      description: description.trim(),
      x,
      y,
      columns,
    });
  };

  return (
    <div
      className="absolute bg-[#2a2a3c] text-white rounded-md shadow-md px-4 py-3 min-w-[400px]"
      style={{ left: x, top: y }}
    >
      {/* 상단: 테이블 이름 / 설명 / 버튼 */}
      <div className="flex items-center space-x-4 justify-between">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            onFocus={() => setFocusedField("name")}
            onBlur={() => setFocusedField(null)}
            placeholder="table"
            autoFocus
            className={`bg-transparent text-sm w-24 placeholder-gray-400 focus:outline-none border-b ${
              focusedField === "name" ? "border-yellow-400" : "border-transparent"
            }`}
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={() => setFocusedField("desc")}
            onBlur={() => setFocusedField(null)}
            placeholder="description"
            className={`bg-transparent text-sm w-40 placeholder-gray-400 focus:outline-none border-b ${
              focusedField === "desc" ? "border-yellow-400" : "border-transparent"
            }`}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAddColumn}
            className="text-yellow-400 hover:text-yellow-300 text-sm"
            title="컬럼 추가"
          >
            <FaPlus />
          </button>
          <button
            onClick={handleConfirm}
            className="text-white hover:text-green-400 text-sm"
            title="확정"
          >
            ✔
          </button>
          <button
            onClick={onCancel}
            className="text-white hover:text-red-400 text-sm"
            title="취소"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* 컬럼 리스트 */}
      {showColumns && (
        <div className="mt-3 flex flex-col gap-1">
          {columns.map((col, idx) => (
            <ColumnInputRow
              key={idx}
              index={idx}
              column={col}
              onChange={handleColumnChange}
              onDelete={handleDeleteColumn}
              onTogglePrimaryKey={handleTogglePrimaryKey}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ErdTableInputBox;
