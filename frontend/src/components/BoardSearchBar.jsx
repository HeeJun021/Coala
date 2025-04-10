import React from "react";

const BoardSearchBar = ({ value, onChange, onSearch }) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSearch(); // 엔터 입력 시 검색 실행
    }
  };

  return (
    <div className="flex items-center mr-2">
      <input
        type="text"
        placeholder="게시글 제목 검색"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        className="border border-gray-300 px-3 py-2 rounded-l-md w-64"
      />
      <button
        onClick={onSearch}
        className="bg-green-500 text-white px-4 py-2 rounded-r-md hover:bg-green-600"
      >
        검색
      </button>
    </div>
  );
};

export default BoardSearchBar;
