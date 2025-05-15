import React from "react";
import ErdTableInputBox from "./ErdTableInputBox";
import ErdTableBox from "./ErdTableBox";

const ErdCanvas = ({
  isPlacing,
  setIsPlacing,
  tempTable,
  setTempTable,
  tables,
  setTables,
}) => {
  const handleClick = (e) => {
    if (!isPlacing) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setTempTable({ x, y });
    setIsPlacing(false); // 커서 복원
  };

  return (
    <div
      onClick={handleClick}
      className={`w-full h-full relative overflow-hidden p-4 ${
        isPlacing ? "cursor-crosshair" : "cursor-default"
      }`}
    >
      {/* 확정된 테이블 박스들 */}
      {tables.map((tbl, idx) => (
        <ErdTableBox key={idx} {...tbl} />
      ))}

      {/* 입력 박스 */}
      {tempTable && (
        <ErdTableInputBox
          x={tempTable.x}
          y={tempTable.y}
          onConfirm={(data) => {
            setTables([...tables, data]);
            setTempTable(null);
          }}
          onCancel={() => setTempTable(null)}
        />
      )}
    </div>
  );
};

export default ErdCanvas;
