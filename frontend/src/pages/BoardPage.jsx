import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import BoardSidebar from "../components/BoardSidebar";
import BoardList from "../components/BoardList";

const BoardPage = () => {
  const { boardType } = useParams();
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto p-8 bg-white min-h-screen flex">
      {/* 사이드바 */}
      <BoardSidebar />

      {/* 메인 영역 */}
      <div className="flex-1 ml-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {boardType === "free"
              ? "자유게시판"
              : boardType === "project"
              ? "프로젝트 게시판"
              : "코드 공유 게시판"}
          </h2>
          <button
            onClick={() => navigate(`/board/${boardType}/write`)}
            className="px-4 py-2 bg-green-500 text-white rounded-md"
          >
            글 작성하기
          </button>
        </div>

        {/* 게시글 목록 */}
        <BoardList boardType={boardType} />
      </div>
    </div>
  );
};

export default BoardPage;
