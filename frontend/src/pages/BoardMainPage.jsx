import React from "react";
import { useNavigate } from "react-router-dom";

export const BoardMainPage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen">
      <h2 className="text-2xl font-semibold mb-6">게시판 메인</h2>
      <div className="space-y-4">
        <button
          onClick={() => navigate("/board/free")}
          className="w-full p-4 bg-gray-200 rounded-md text-left"
        >
          자유게시판 바로가기
        </button>
        <button
          onClick={() => navigate("/board/project")}
          className="w-full p-4 bg-gray-200 rounded-md text-left"
        >
          프로젝트 게시판 바로가기
        </button>
        <button
          onClick={() => navigate("/board/code")}
          className="w-full p-4 bg-gray-200 rounded-md text-left"
        >
          코드 공유 게시판 바로가기
        </button>
      </div>
    </div>
  );
};
