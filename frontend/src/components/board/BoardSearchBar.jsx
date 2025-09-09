import React from "react";
import { Search, X } from "lucide-react";

/**
 * 게시판/코딩테스트 공용 검색바 (코딩테스트 스타일)
 *
 * Props
 * - value: string
 * - onChange: (e) => void
 * - onSearch: () => void      // Enter 또는 검색 아이콘 클릭
 * - onClear?: () => void      // 선택: 값 있을 때 X 아이콘 표시
 * - placeholder?: string      // 기본 "게시글 제목 검색"
 * - widthClass?: string       // 기본 "w-[500px]"
 */
const BoardSearchBar = ({
  value,
  onChange,
  onSearch,
  onClear,
  placeholder = "게시글 제목 검색",
  widthClass = "w-[500px]",
}) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") onSearch();
  };

  const hasValue = !!(value && String(value).length);

  return (
    <div
      className={[
        "flex items-center border rounded-lg px-3 py-2 bg-white",
        // 코딩테스트 톤: 값 있을 때는 초록 테두리, 없으면 회색 + hover/focus green
        hasValue
          ? "border-green-500"
          : "border-gray-300 hover:border-green-400 focus-within:border-green-400",
        widthClass,
      ].join(" ")}
      role="search"
      aria-label="검색바"
    >
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        className="flex-1 bg-transparent outline-none text-sm"
        aria-label="검색어 입력"
      />

      {onClear && hasValue && (
        <button
          type="button"
          onClick={onClear}
          className="mx-2"
          title="검색어 초기화"
          aria-label="검색어 초기화"
        >
          <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        </button>
      )}

      <button
        type="button"
        onClick={onSearch}
        title="검색"
        aria-label="검색 실행"
      >
        <Search className="w-4 h-4 text-gray-500 hover:text-gray-700" />
      </button>
    </div>
  );
};

export default BoardSearchBar;
