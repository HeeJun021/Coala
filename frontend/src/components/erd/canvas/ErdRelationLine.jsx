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

  // ✅ 색상 변수 선언
  const RELATION_COLOR = "#fb923c";
  const SELECTED_COLOR = "#60a5fa";
  const BACKGROUND_COLOR = "#1e1e2e";

  const lineColor = isSelected ? SELECTED_COLOR : RELATION_COLOR;
  const symbolColor = isSelected ? SELECTED_COLOR : RELATION_COLOR;
  const strokeWidth = isSelected ? 2.5 : 1.5;
  const circleStrokeWidth = isSelected ? 2.5 : 1.5;

  const isLeftToRight = fromColumn.left < toColumn.left;
  const stubLength = 40;

  const fromStubEndX = isLeftToRight
    ? fromColumn.right + stubLength
    : fromColumn.left - stubLength;

  const toStubEndX = isLeftToRight
    ? toColumn.left - stubLength
    : toColumn.right + stubLength;

  const from = {
    x: isLeftToRight ? fromColumn.right : fromColumn.left,
    y: fromColumn.y,
  };
  const to = {
    x: isLeftToRight ? toColumn.left : toColumn.right,
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
          stroke={symbolColor}
          strokeWidth={strokeWidth}
        />
      );
    } else if (type === "crow") {
      const size = 10;
      const direction = isLeft ? -1 : 1;

      return (
        <g stroke={symbolColor} strokeWidth={strokeWidth} fill="none">
          <polyline points={`${x},${y} ${x + direction * size},${y - size}`} />
          <polyline points={`${x},${y} ${x + direction * size},${y}`} />
          <polyline points={`${x},${y} ${x + direction * size},${y + size}`} />
        </g>
      );
    }
    return null;
  };

  const getParticipationSymbol = (participation, x, y) => {
    if (participation === "required") {
      return (
        <line
          x1={x}
          y1={y - 6}
          x2={x}
          y2={y + 6}
          stroke={symbolColor}
          strokeWidth={strokeWidth}
        />
      );
    } else if (participation === "optional") {
      return (
        <circle
          cx={x}
          cy={y}
          r="5"
          stroke={symbolColor}
          strokeWidth={circleStrokeWidth}
          fill={BACKGROUND_COLOR} // ✅ 항상 캔버스 배경색
        />
      );
    }
    return null;
  };

  return (
    <svg
  className="absolute top-0 left-0"
  width="2000"
  height="2000"
  style={{ pointerEvents: "none", zIndex: 100 }}
>

      {/* 클릭 가능한 선들 */}
      <line
        x1={from.x}
        y1={from.y}
        x2={fromStubEndX}
        y2={from.y}
        stroke={lineColor}
        strokeWidth="2.5"
        style={{ pointerEvents: "all" }}
        className="pointer-events-auto cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      />
      <line
        x1={fromStubEndX}
        y1={from.y}
        x2={toStubEndX}
        y2={to.y}
        stroke={lineColor}
        strokeWidth="2.5"
        style={{ pointerEvents: "none" }}
      />
      <line
        x1={fromStubEndX}
        y1={from.y}
        x2={toStubEndX}
        y2={to.y}
        stroke="transparent"
        strokeWidth="10"
        style={{ pointerEvents: "stroke" }}
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      />
      <line
        x1={toStubEndX}
        y1={to.y}
        x2={to.x}
        y2={to.y}
        stroke={lineColor}
        strokeWidth="2.5"
        style={{ pointerEvents: "all" }}
        className="pointer-events-auto cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      />

      {/* 기호 렌더링 */}
      {getRelationSymbol(
        relation_left,
        from.x + (isLeftToRight ? 10 : -10),
        from.y,
        true
      )}
      {getParticipationSymbol(
        participation_left,
        from.x + (isLeftToRight ? 13 : -20),
        from.y
      )}

      {getParticipationSymbol(participation_right, to.x - 20, to.y)}
      {getRelationSymbol(relation_right, to.x - 10, to.y, false)}
    </svg>
  );
};

export default ErdRelationLine;
