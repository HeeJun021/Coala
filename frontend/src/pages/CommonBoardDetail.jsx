import React from "react";
import { useNavigate } from "react-router-dom";
import BoardDetailTemplate from "./BoardDetailTemplate";

const CommonBoardDetail = (props) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-green-700">자유 게시판</h1>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-300 text-black rounded-md"
        >
          뒤로가기
        </button>
      </div>
      <BoardDetailTemplate {...props} commentType="basic" />
    </div>
  );
};

export default CommonBoardDetail;
