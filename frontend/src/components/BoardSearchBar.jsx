import React from "react";
import { FaSearch } from "react-icons/fa";

const BoardSearchBar = ({ value, onChange }) => {
  return (
    <div className="flex items-center border border-gray-300 rounded-md px-2 py-1 mr-4 w-72">
      <input
        type="text"
        placeholder="게시글 제목 검색"
        value={value}
        onChange={onChange}
        className="flex-1 outline-none px-2"
      />
      <FaSearch className="text-gray-500" />
    </div>
  );
};

export default BoardSearchBar;
