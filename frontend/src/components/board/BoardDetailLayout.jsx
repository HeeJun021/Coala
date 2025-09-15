import React from "react";

const BoardDetailLayout = ({ title, onBack, children }) => {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen">
      {/* 상단: 게시판 이름 + 뒤로가기 */}
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <h1 className="text-xl font-bold text-green-700">{title}</h1>
        <button
          onClick={onBack}
          className="px-4 py-1 bg-gray-200 text-sm rounded-md"
        >
          ← 뒤로가기
        </button>
      </div>
      {children}
    </div>
  );
};

export default BoardDetailLayout;
