import React, { useState, useRef } from "react";
import Draggable from "react-draggable";

const relationOptions = [
  { label: "1:1 (필수 - 필수)", value: "1|1" },
  { label: "1:1 (필수 - 선택)", value: "1|0..1" },
  { label: "1:N (필수 - 필수 다수)", value: "1|1..*" },
  { label: "1:N (필수 - 선택 다수)", value: "1|0..*" },
  { label: "1:1 (선택 - 필수)", value: "0..1|1" },
  { label: "1:N (선택 - 필수 다수)", value: "0..1|1..*" },
  { label: "1:N (선택 - 선택 다수)", value: "0..1|0..*" },
  { label: "M:N (필수 - 필수)", value: "1..*|1..*" },
  { label: "M:N (필수 - 선택)", value: "1..*|0..*" },
  { label: "M:N (선택 - 필수)", value: "0..*|1..*" },
];

const FloatingToolButton = ({
  onAddTable,
  onAddRelation,
  onStartDragging,
  onStopDragging,
}) => {
  const [open, setOpen] = useState(false);
  const [relationMenuOpen, setRelationMenuOpen] = useState(false);

  const wasDragging = useRef(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  const handleMainClick = () => {
    if (wasDragging.current) {
      wasDragging.current = false;
      return;
    }
    setOpen((prev) => !prev);
    setRelationMenuOpen(false);
  };

  return (
    <Draggable
      nodeRef={containerRef}
      defaultPosition={{ x: 25, y: 25 }}
      onStart={() => {
        wasDragging.current = false;
        onStartDragging?.();
      }}
      onDrag={() => {
        wasDragging.current = true;
      }}
      onStop={() => {
        setTimeout(() => {
          wasDragging.current = false;
        }, 50);
        onStopDragging?.();
      }}
    >
      <div
        ref={containerRef}
        className="z-50 fixed"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        {/* 🔘 메인 플로팅 버튼 */}
        <button
          ref={buttonRef}
          onClick={handleMainClick}
          className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xl shadow-lg"
        >
          🛠
        </button>

        {/* 📂 확장 메뉴 */}
        {open && (
          <div className="absolute left-0 bg-[#2a2a3c] text-white rounded-md shadow-lg w-44 py-2 z-50">
            <button
              onClick={() => {
                onAddTable?.();
                setOpen(false);
              }}
              className="block w-full text-left px-4 py-2 hover:bg-[#3a3a4c] text-sm"
            >
              ➕ 테이블 추가
            </button>

            {/* ⇄ 관계 추가 메뉴 */}
            <div
              className="relative group"
              onMouseEnter={() => setRelationMenuOpen(true)}
              onMouseLeave={() => setRelationMenuOpen(false)}
            >
              <button className="block w-full text-left px-4 py-2 hover:bg-[#3a3a4c] text-sm">
                ⇄ 관계 추가 ▸
              </button>

              {relationMenuOpen && (
                <div className="absolute left-full top-0 bg-[#2a2a3c] border-l border-gray-700 rounded-md shadow-lg w-60 z-50">
                  {relationOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onAddRelation?.(option.value);
                        setOpen(false);
                        setRelationMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-1 hover:bg-[#3a3a4c] text-sm"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 🔧 기타 버튼 (추후 기능 추가용) */}
            <button className="block w-full text-left px-4 py-2 hover:bg-[#3a3a4c] text-sm">
              🕓 히스토리
            </button>
            <button className="block w-full text-left px-4 py-2 hover:bg-[#3a3a4c] text-sm">
              ⚙️ 설정
            </button>
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default FloatingToolButton;
