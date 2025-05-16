import React from "react";

const ErdRelationLine = ({
  fromColumn,
  toColumn,
  label,
  onClick,
  isSelected,
}) => {
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
      {/* ✅ 선택 시 아래 그림자 선 먼저 렌더링 */}
      {isSelected && (
        <line
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke="#fde68a" // 연노랑 그림자
          strokeWidth="6"
          opacity="0.6"
          className="pointer-events-none"
        />
      )}

      {/* 실제 메인 선 */}
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={isSelected ? "#facc15" : "#f472b6"} // 노랑 or 핑크
        strokeWidth="2.5"
        className="pointer-events-auto cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      />

      {/* 라벨 텍스트 */}
      <text
        x={midX}
        y={midY - 6}
        textAnchor="middle"
        fill={isSelected ? "#facc15" : "#f472b6"}
        fontSize="10px"
        fontFamily="monospace"
        className="pointer-events-auto cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        {label}
      </text>
    </svg>
  );
};

export default ErdRelationLine;
