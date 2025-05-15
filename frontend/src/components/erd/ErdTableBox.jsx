import React from "react";

const ErdTableBox = ({ x, y, name, description }) => {
  return (
    <div
      className="absolute bg-[#343447] text-white px-4 py-2 rounded shadow"
      style={{ left: x, top: y }}
    >
      <div className="font-bold">{name}</div>
      <div className="text-sm text-gray-300">{description}</div>
    </div>
  );
};

export default ErdTableBox;
