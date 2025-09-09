import React from "react";
import { useParams } from "react-router-dom";
import BoardSidebar from "../../components/board/BoardSidebar";
import BoardList from "../../components/board/BoardList";

const BoardPage = () => {
  const { boardType } = useParams();

  return (
    <div className="max-w-7xl mx-auto min-h-screen flex">
      {/* 사이드바 */}
      <BoardSidebar />

      {/* 메인 영역 */}
      <div className="flex-1 ml-8">

        {/* 게시글 목록 */}
        <BoardList boardType={boardType} />
      </div>
    </div>
  );
};

export default BoardPage;
