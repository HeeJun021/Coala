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
  const RELATION_COLOR = "#64748b"; // slate-500
  const SELECTED_COLOR = "#3b82f6"; // blue-500
  const BACKGROUND_COLOR = "#ffffff"; // 라이트 배경

  const lineColor = isSelected ? SELECTED_COLOR : RELATION_COLOR;
  const symbolColor = isSelected ? SELECTED_COLOR : RELATION_COLOR;
  const strokeWidth = isSelected ? 3 : 2;
  const circleStrokeWidth = isSelected ? 3 : 2;


  // 항상 화면상 좌 → 우로 선을 보이도록 강제 렌더링 보정
  const isLeftToRightVisual = fromColumn.left < toColumn.left;

  const visualFrom = isLeftToRightVisual ? fromColumn : toColumn;
  const visualTo = isLeftToRightVisual ? toColumn : fromColumn;

  const from = {
    x: visualFrom.right,
    y: visualFrom.y,
  };
  const to = {
    x: visualTo.left,
    y: visualTo.y,
  };

  const stubLength = 40;
  const fromStubEndX = from.x + stubLength;
  const toStubEndX = to.x - stubLength;

  // 렌더링용 참여도/기호 방향도 정렬
  const participationLeft = isLeftToRightVisual
    ? participation_left
    : participation_right;
  const participationRight = isLeftToRightVisual
    ? participation_right
    : participation_left;

  const relationLeft = isLeftToRightVisual ? relation_left : relation_right;
  const relationRight = isLeftToRightVisual ? relation_right : relation_left;

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

      {getRelationSymbol(relationLeft, from.x + 10, from.y, true)}
      {getParticipationSymbol(participationLeft, from.x + 15, from.y)}
      {getParticipationSymbol(participationRight, to.x - 22, to.y)}
      {getRelationSymbol(relationRight, to.x - 10, to.y, false)}
    </svg>
  );
};

export default ErdRelationLine;
