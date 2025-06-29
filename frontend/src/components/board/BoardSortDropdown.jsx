import React from "react";

const BoardSortDropdown = ({ value, onChange }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-300 rounded-md px-2 py-1"
    >
      <option value="최신 순">최신 순</option>
      <option value="댓글 많은 순">댓글 많은 순</option>
      <option value="좋아요 많은 순">좋아요 많은 순</option>
    </select>
  );
};

export default BoardSortDropdown;
