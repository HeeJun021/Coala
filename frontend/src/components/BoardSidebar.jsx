import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const BOARD_LABELS = {
  free: "자유게시판",
  project: "프로젝트 게시판",
  code: "코드 공유 게시판",
};

const BoardSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="w-48 p-6">
      <h2 className="text-lg font-semibold mb-4">게시판</h2>
      <ul className="flex flex-col">
        {Object.entries(BOARD_LABELS).map(([key, label], index) => (
          <li key={key}>
            <button
              onClick={() => navigate(`/board/${key}`)}
              className={`w-full text-left px-3 py-2 font-medium border
                ${
                  location.pathname.includes(key)
                    ? "bg-green-200 text-black"
                    : "bg-gray-300 text-black"
                } ${
                index === 0 ? "rounded-t-sm" : index === 2 ? "rounded-b-sm" : ""
              }`}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BoardSidebar;
