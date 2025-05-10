import React, { useState } from "react";

const GptSessionItem = ({
  session,
  isActive,
  onSelect,
  onRename,
  onDelete,
}) => {
  const [hovered, setHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [titleInput, setTitleInput] = useState(session.title || "");

  const handleRename = async () => {
    await onRename(titleInput);
    setRenaming(false);
    setIsMenuOpen(false);
  };

  return (
    <div
      className={`w-full flex justify-between items-center px-2 py-1 rounded cursor-pointer ${
        isActive ? "bg-gray-200" : "hover:bg-gray-100"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setIsMenuOpen(false); // 메뉴도 같이 닫음
      }}
      onClick={onSelect}
    >
      {renaming ? (
        <input
          autoFocus
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRename();
            if (e.key === "Escape") {
              setRenaming(false);
              setIsMenuOpen(false);
            }
          }}
          className="flex-1 bg-white border px-1 py-0.5 text-sm rounded"
        />
      ) : (
        <span className="truncate flex-1 text-sm">
          {session.title || "제목 없음"}
        </span>
      )}

      {(hovered || isActive) && !renaming && (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((prev) => !prev); // 클릭으로만 메뉴 토글
            }}
            className="ml-2 px-2 text-gray-500 hover:text-black"
          >
            ⋯
          </button>
          {isMenuOpen && (
            <div
              className="absolute right-0 mt-1 w-28 bg-white border shadow rounded z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setRenaming(true)}
                className="w-full text-left px-3 py-1 hover:bg-gray-100 text-sm"
              >
                ✏️ 이름 수정
              </button>
              <button
                onClick={() => {
                  if (window.confirm("정말 삭제할까요?")) onDelete();
                }}
                className="w-full text-left px-3 py-1 hover:bg-gray-100 text-sm text-red-500"
              >
                🗑 삭제하기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GptSessionItem;
