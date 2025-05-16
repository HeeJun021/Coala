import React from "react";

const ErdRelationLine = ({ fromColumn, toColumn, label }) => {
  if (
    !fromColumn ||
    !toColumn ||
    fromColumn.left === undefined ||
    fromColumn.right === undefined ||
    fromColumn.y === undefined ||
    toColumn.left === undefined ||
    toColumn.right === undefined ||
    toColumn.y === undefined
  ) {
    return null; // ❗ 좌표가 없으면 그리지 않음
  }

  const from = {
    x: fromColumn.left < toColumn.left ? fromColumn.right : fromColumn.left,
    y: fromColumn.y,
  };
  const to = {
    x: fromColumn.left < toColumn.left ? toColumn.left : toColumn.right,
    y: toColumn.y,
  };

  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke="#f472b6"
        strokeWidth="2"
      />
      <text
        x={midX}
        y={midY - 6}
        textAnchor="middle"
        fill="#f472b6"
        fontSize="10px"
        fontFamily="monospace"
      >
        {label}
      </text>
    </svg>
  );
};

export default ErdRelationLine;