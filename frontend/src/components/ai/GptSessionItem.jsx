import React, { useState } from "react";
import { Pencil, Trash2, MoreVertical } from "lucide-react";

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
      className={`w-full flex items-center px-2 py-[5px] rounded cursor-pointer transition ${
        isActive ? "bg-gray-200" : "hover:bg-gray-100"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setIsMenuOpen(false);
      }}
      onClick={onSelect}
    >
      {/* 왼쪽 영역 */}
      <div className="flex-1 min-w-0">
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
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-100 transition"
          />
        ) : (
          <span className="truncate text-sm">
            {session.title || "제목 없음"}
          </span>
        )}
      </div>

      {/* 오른쪽 버튼 */}
      {!renaming && (
        <div className="relative flex-shrink-0 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((prev) => !prev);
            }}
            className={`text-gray-500 hover:text-black transition-opacity duration-150 ${
              hovered || isActive ? "opacity-100" : "opacity-0"
            }`}
          >
            <MoreVertical size={16} />
          </button>

          {isMenuOpen && (
            <div
              className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 shadow-md rounded z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setRenaming(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
              >
                <Pencil size={14} /> 이름 수정
              </button>
              <button
                onClick={() => {
                  if (window.confirm("정말 삭제할까요?")) onDelete();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 text-red-500"
              >
                <Trash2 size={14} /> 삭제하기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GptSessionItem;
