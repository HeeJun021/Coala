import React, { useState, useRef } from "react";
import Draggable from "react-draggable";

const FloatingToolButton = ({ onAddTable, onAddRelation }) => {
  const [open, setOpen] = useState(false);
  const [relationMenuOpen, setRelationMenuOpen] = useState(false); // 관계 하위 메뉴 열림
  const wasDragging = useRef(false);
  const buttonRef = useRef(null);
  const containerRef = useRef(null);

  const handleClick = () => {
    if (wasDragging.current) {
      wasDragging.current = false;
      return;
    }

    setOpen((prev) => !prev);
    setRelationMenuOpen(false); // 관계 메뉴는 닫기
  };

  return (
    <Draggable
      nodeRef={containerRef}
      defaultPosition={{ x: 25, y: 25 }}
      onStart={() => {
        wasDragging.current = false;
      }}
      onDrag={() => {
        wasDragging.current = true;
      }}
      onStop={() => {
        setTimeout(() => {
          wasDragging.current = false;
        }, 50);
      }}
    >
      <div ref={containerRef} className="z-50 fixed">
        {/* 툴 버튼 */}
        <button
          ref={buttonRef}
          onClick={handleClick}
          className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xl shadow-lg"
        >
          🛠
        </button>

        {/* 펼쳐진 메뉴 */}
        {open && (
          <div
            className={`absolute left-0 bg-[#2a2a3c] text-white rounded-md shadow-lg w-44 py-2 z-50`}
          >
            {/* 테이블 추가 */}
            <button
              onClick={() => {
                onAddTable();
                setOpen(false);
              }}
              className="block w-full text-left px-4 py-2 hover:bg-[#3a3a4c] text-sm"
            >
              ➕ 테이블 추가
            </button>

            {/* 관계 추가 */}
            <div
              className="relative group"
              onMouseEnter={() => setRelationMenuOpen(true)}
              onMouseLeave={() => setRelationMenuOpen(false)}
            >
              <button className="block w-full text-left px-4 py-2 hover:bg-[#3a3a4c] text-sm">
                ⇄ 관계 추가 ▸
              </button>

              {/* 관계 타입 서브메뉴 */}
              {relationMenuOpen && (
                <div className="absolute left-full top-0 bg-[#2a2a3c] border-l border-gray-700 rounded-md shadow-lg w-32 z-50">
                  {["1:1", "1:N", "N:M"].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        onAddRelation(type); // 콜백으로 전달
                        setOpen(false);
                        setRelationMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-1 hover:bg-[#3a3a4c] text-sm"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 나머지 항목 */}
            <button className="block w-full text-left px-4 py-2 hover:bg-[#3a3a4c] text-sm">
              📦 내보내기
            </button>
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
