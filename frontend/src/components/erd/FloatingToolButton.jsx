import React, { useState, useRef } from "react";
import Draggable from "react-draggable";

const FloatingToolButton = ({ onAddTable }) => {
  const [open, setOpen] = useState(false);
  const wasDragging = useRef(false);
  const buttonRef = useRef(null);
  const [openDirection, setOpenDirection] = useState("up"); // 'up' or 'down'

  const handleClick = () => {
    if (wasDragging.current) {
      wasDragging.current = false;
      return;
    }

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const threshold = viewportHeight / 2;
      setOpenDirection(rect.top < threshold ? "down" : "up");
    }

    setOpen(!open);
  };

  return (
    <Draggable
      defaultPosition={{ x: 25, y: 25 }} // ✅ 초기 좌표 (화면에 맞게 조절)
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
      <div className="z-50 fixed">
        {/* 🛠 툴 버튼 */}
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
  className={`absolute left-0 
    ${openDirection === "up" ? "bottom-full mb-2" : "top-full mt-2"} 
    bg-[#2a2a3c] text-white rounded-md shadow-lg w-40 py-2 z-50`}
>

            <button
              onClick={() => {
                onAddTable();
                setOpen(false);
              }}
              className="block w-full text-left px-4 py-2 hover:bg-[#3a3a4c] text-sm"
            >
              ➕ 테이블 추가
            </button>
            <button className="block w-full text-left px-4 py-2 hover:bg-[#3a3a4c] text-sm">
              ⇄ 관계 추가
            </button>
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
