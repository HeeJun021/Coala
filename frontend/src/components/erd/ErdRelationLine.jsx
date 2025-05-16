// src/components/erd/ErdRelationLine.jsx
import React from "react";

const ErdRelationLine = ({ from, to, columnPositions, type, label }) => {
  const fromPos = columnPositions[from];
  const toPos = columnPositions[to];
  if (!fromPos || !toPos) return null;

  const startX = fromPos.right;
  const startY = fromPos.y;
  const endX = toPos.left;
  const endY = toPos.y;

  // 방향 벡터
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / length;
  const uy = dy / length;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  const offset = 16;

  // from, to 기호 기준 위치 (선상 안쪽으로 offset 만큼 이동)
  const fx = startX + ux * offset;
  const fy = startY + uy * offset;
  const tx = endX - ux * offset;
  const ty = endY - uy * offset;

  const drawFromSymbol = () => {
    if (type === "1:1" || type === "1:N") {
      return (
        <g transform={`rotate(${angle}, ${fx}, ${fy})`}>
          <line x1={fx - 4} y1={fy - 6} x2={fx - 4} y2={fy + 6} stroke="#f472b6" strokeWidth={2} />
          <line x1={fx}     y1={fy - 6} x2={fx}     y2={fy + 6} stroke="#f472b6" strokeWidth={2} />
        </g>
      );
    } else if (type === "N:1" || type === "N:N") {
      return (
        <g transform={`rotate(${angle}, ${fx}, ${fy})`}>
          <line x1={fx} y1={fy} x2={fx - 6} y2={fy - 6} stroke="#f472b6" strokeWidth={2} />
          <line x1={fx} y1={fy} x2={fx - 6} y2={fy + 6} stroke="#f472b6" strokeWidth={2} />
        </g>
      );
    }
  };

  const drawToSymbol = () => {
    if (type === "1:1" || type === "N:1") {
      return (
        <g transform={`rotate(${angle}, ${tx}, ${ty})`}>
          <line x1={tx}     y1={ty - 6} x2={tx}     y2={ty + 6} stroke="#f472b6" strokeWidth={2} />
          <line x1={tx + 4} y1={ty - 6} x2={tx + 4} y2={ty + 6} stroke="#f472b6" strokeWidth={2} />
        </g>
      );
    } else if (type === "1:N" || type === "N:N") {
      return (
        <g transform={`rotate(${angle}, ${tx}, ${ty})`}>
          <line x1={tx} y1={ty} x2={tx + 6} y2={ty - 6} stroke="#f472b6" strokeWidth={2} />
          <line x1={tx} y1={ty} x2={tx + 6} y2={ty + 6} stroke="#f472b6" strokeWidth={2} />
        </g>
      );
    }
  };

  return (
    <>
      {/* 메인 선 */}
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke="#f472b6"
        strokeWidth={2}
      />

      {/* 라벨 (선 중앙) */}
      {label && (
        <text
          x={(startX + endX) / 2}
          y={(startY + endY) / 2 - 6}
          fill="#f472b6"
          fontSize="12"
          textAnchor="middle"
          pointerEvents="none"
        >
          {label}
        </text>
      )}

      {drawFromSymbol()}
      {drawToSymbol()}
    </>
  );
};

export default ErdRelationLine;
