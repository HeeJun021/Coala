import React, { useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import ErdTableBox from "./ErdTableBox";
import FloatingToolButton from "./FloatingToolButton";

const ErdCanvas = ({ isPlacing, setIsPlacing, tables, setTables }) => {
  const canvasRef = useRef(null);

  const handleCanvasClick = (e) => {
    if (!isPlacing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newTable = {
      id: uuidv4(),
      x,
      y,
      tableName: "",
      description: "",
      columns: [],
    };

    setTables((prev) => [...prev, newTable]);
    setIsPlacing(false);
  };

  const handleUpdateTable = useCallback(
    (updated) => {
      setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    },
    [setTables]
  );

  const handleDeleteTable = useCallback(
    (id) => {
      setTables((prev) => prev.filter((t) => t.id !== id));
    },
    [setTables]
  );

  return (
    <div
      id="erd-canvas"
      ref={canvasRef}
      onClick={handleCanvasClick}
      className={`relative w-full h-full bg-[#1e1e2f] overflow-hidden ${
        isPlacing ? "cursor-crosshair" : "cursor-default"
      }`}
    >
      {tables.map((table) => (
        <ErdTableBox
          key={table.id}
          {...table}
          onUpdate={handleUpdateTable}
          onDelete={() => handleDeleteTable(table.id)}
        />
      ))}

      <FloatingToolButton onAddTable={() => setIsPlacing(true)} />
    </div>
  );
};

export default ErdCanvas;
