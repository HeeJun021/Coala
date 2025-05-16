import React from "react";

const ErdRelationLine = ({ from, to, columnPositions, type, label }) => {
  const fromPos = columnPositions[from];
  const toPos = columnPositions[to];
  if (!fromPos || !toPos) return null;

  const startX = fromPos.right;
  const startY = fromPos.y;
  const endX = toPos.left;
  const endY = toPos.y;

  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / length;
  const uy = dy / length;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  const offset = 16;
  const fx = startX + ux * offset;
  const fy = startY + uy * offset;
  const tx = endX - ux * offset;
  const ty = endY - uy * offset;

  const [fromPart, toPart] = type.split("|");

  const drawParticipationSymbol = (side, participation) => {
    const baseX = side === "from" ? fx : tx;
    const baseY = side === "from" ? fy : ty;
    const direction = side === "from" ? -1 : 1;

    const symbols = [];
    let x = baseX;

    // 선택 참여도 (O)
    if (participation === "0..1" || participation === "0..*") {
      symbols.push(
        <circle
          key={`circle-${side}`}
          cx={x}
          cy={baseY}
          r={4}
          stroke="#f472b6"
          strokeWidth={2}
          fill="none"
        />
      );
      x += direction * 10;
    }

    // 필수 참여도 (| 또는 ||)
    if (participation === "1") {
      symbols.push(
        <>
          <line
            key={`bar1-${side}`}
            x1={x}
            y1={baseY - 6}
            x2={x}
            y2={baseY + 6}
            stroke="#f472b6"
            strokeWidth={2}
          />
          <line
            key={`bar2-${side}`}
            x1={x + direction * 4}
            y1={baseY - 6}
            x2={x + direction * 4}
            y2={baseY + 6}
            stroke="#f472b6"
            strokeWidth={2}
          />
        </>
      );
      x += direction * 8;
    } else if (participation === "0..1" || participation === "1..*" || participation === "0..*") {
      symbols.push(
        <line
          key={`bar-${side}`}
          x1={x}
          y1={baseY - 6}
          x2={x}
          y2={baseY + 6}
          stroke="#f472b6"
          strokeWidth={2}
        />
      );
      x += direction * 8;
    }

    // 다수 (<)
    if (participation.endsWith("*")) {
      symbols.push(
        <React.Fragment key={`crowfoot-${side}`}>
          <line
            key={`crowfoot1-${side}`}
            x1={x}
            y1={baseY}
            x2={x + direction * 6}
            y2={baseY - 6}
            stroke="#f472b6"
            strokeWidth={2}
          />
          <line
            key={`crowfoot2-${side}`}
            x1={x}
            y1={baseY}
            x2={x + direction * 6}
            y2={baseY + 6}
            stroke="#f472b6"
            strokeWidth={2}
          />
        </React.Fragment>
      );
    }

    return <g transform={`rotate(${angle}, ${baseX}, ${baseY})`}>{symbols}</g>;
  };

  return (
    <>
      {/* 관계선 (기호 안쪽만 연결) */}
      <line
        x1={fx}
        y1={fy}
        x2={tx}
        y2={ty}
        stroke="#f472b6"
        strokeWidth={2}
      />

      {/* 라벨 */}
      {label && (
        <text
          x={(fx + tx) / 2}
          y={(fy + ty) / 2 - 6}
          fill="#f472b6"
          fontSize="12"
          textAnchor="middle"
          pointerEvents="none"
        >
          {label}
        </text>
      )}

      {/* 참여도 기호 */}
      {drawParticipationSymbol("from", fromPart)}
      {drawParticipationSymbol("to", toPart)}
    </>
  );
};

export default ErdRelationLine;
