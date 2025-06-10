import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const BOARD_LABELS = {
  free: "자유 게시판",
  project: "프로젝트 게시판",
  code: "코드 공유 게시판",
};

const BoardSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentBoard = location.pathname.split("/")[2] || "free";

  const handleClick = (boardType) => {
    navigate(`/board/${boardType}`);
  };

  return (
    <div
      className="absolute left-[33px] w-[260px] bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden z-40"
      style={{ top: "239px" }}
    >
      {/* ✅ 상단 헤더 */}
      <div className="h-[56px] flex items-center px-6 bg-[#88C078] rounded-t-2xl shadow-sm">
        <h1 className="text-[18px] font-semibold text-black tracking-wide">게시판</h1>
      </div>

      {/* ✅ 게시판 목록 */}
      <div className="divide-y divide-gray-100">
        {Object.entries(BOARD_LABELS).map(([key, label]) => (
          <div
            key={key}
            className={`px-6 py-4 cursor-pointer text-[16px] font-semibold transition-all duration-150 ${
              currentBoard === key
                ? "bg-[#D9D9D9] text-gray-800"
                : "hover:bg-gray-100 text-gray-600"
            }`}
            onClick={() => handleClick(key)}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoardSidebar;
