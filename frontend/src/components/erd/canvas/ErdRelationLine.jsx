import React from "react";

const ErdRelationLine = ({
  fromColumn,
  toColumn,
  participation_left,
  relation_left,
  relation_right,
  participation_right,
  isSelected,
  onClick,
}) => {
  if (!fromColumn || !toColumn) return null;

  const from = {
    x: fromColumn.left < toColumn.left ? fromColumn.right : fromColumn.left,
    y: fromColumn.y,
  };
  const to = {
    x: fromColumn.left < toColumn.left ? toColumn.left : toColumn.right,
    y: toColumn.y,
  };

  const getRelationSymbol = (type, x, y, isLeft) => {
    if (type === "bar") {
      return (
        <line
          x1={x - 4}
          y1={y - 6}
          x2={x - 4}
          y2={y + 6}
          stroke={isSelected ? "#facc15" : "#f472b6"}
          strokeWidth="1.5"
        />
      );
    } else if (type === "crow") {
      const size = 10;
      const direction = isLeft ? -1 : 1;

      return (
        <g
          stroke={isSelected ? "#facc15" : "#f472b6"}
          strokeWidth="1.5"
          fill="none"
        >
          <polyline
            points={`${x},${y} ${x + direction * size},${y - size}`}
          />
          <polyline
            points={`${x},${y} ${x + direction * size},${y}`}
          />
          <polyline
            points={`${x},${y} ${x + direction * size},${y + size}`}
          />
        </g>
      );
    }
    return null;
  };

  const getParticipationSymbol = (value, x, y) => {
    const color = isSelected ? "#facc15" : "#f472b6";

    if (value === "1") {
      return (
        <line
          x1={x}
          y1={y - 6}
          x2={x}
          y2={y + 6}
          stroke={color}
          strokeWidth="2"
        />
      );
    } else {
      return (
        <circle
          cx={x}
          cy={y}
          r="5"
          stroke={color}
          strokeWidth="1.5"
          fill="#1e1e2e" // ✅ 너의 캔버스 배경색
        />
      );
    }
  };

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
      {/* 선택된 그림자 배경선 */}
      {isSelected && (
        <line
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke="#fde68a"
          strokeWidth="6"
          opacity="0.4"
        />
      )}

      {/* 메인 선 */}
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={isSelected ? "#facc15" : "#f472b6"}
        strokeWidth="2.5"
        className="pointer-events-auto cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      />

      {/* 왼쪽 기호 */}
      {getRelationSymbol(relation_left, from.x + 10, from.y, true)}
      {getParticipationSymbol(participation_left, from.x + 20, from.y)}

      {/* 오른쪽 기호 */}
      {getParticipationSymbol(participation_right, to.x - 20, to.y)}
      {getRelationSymbol(relation_right, to.x - 10, to.y, false)}
    </svg>
  );
};

export default ErdRelationLine;
