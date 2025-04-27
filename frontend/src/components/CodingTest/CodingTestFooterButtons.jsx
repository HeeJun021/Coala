import React from "react";
import { Link } from "react-router-dom";

const CodingTestFooterButtons = ({
  problem,
  activeTab,
  handleResetCode,
  handleRunCode,
  handleSubmitCode,
  isSubmitting,
}) => {
  return activeTab === "notes" ? (
    // 오답노트 탭 전용 하단 버튼
    <div className="flex gap-2 justify-end items-center p-3 border-t border-gray-600 bg-[#2c3544]">
      <Link
        to={`/codingtest/correct/${problem.id}`}
        className="text-xs text-white border border-gray-500 px-3 py-2 rounded hover:bg-gray-600 transition"
      >
        다른 사람의 풀이
      </Link>
    </div>
  ) : (
    // 일반 탭용 하단 버튼
    <div className="flex justify-between items-center p-3 border-t border-gray-600 bg-[#2c3544]">
      <button className="text-xs text-white border border-gray-500 px-3 py-2 rounded hover:bg-gray-600 transition">
        질문 게시판 이동하기
      </button>
      <div className="flex gap-2">
        <Link
          to={`/codingtest/correct/${problem.id}`}
          className="text-xs text-white border border-gray-500 px-3 py-2 rounded hover:bg-gray-600 transition"
        >
          다른 사람의 풀이
        </Link>
        <button
          onClick={handleResetCode}
          className="text-xs text-white border border-gray-500 px-3 py-2 rounded hover:bg-gray-600 transition"
        >
          초기화
        </button>
        <button
          onClick={handleRunCode}
          disabled={!problem}
          className={`text-xs text-white border border-gray-500 px-3 py-2 rounded transition ${
            !problem ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-600"
          }`}
        >
          테스트케이스 실행
        </button>
        <button
          onClick={handleSubmitCode}
          disabled={!problem || isSubmitting}
          className={`text-xs bg-blue-500 text-white px-3 py-2 rounded transition ${
            !problem || isSubmitting
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-blue-600"
          }`}
        >
          {isSubmitting ? "채점 중..." : "코드 제출 후 채점"}
        </button>
      </div>
    </div>
  );
};

export default CodingTestFooterButtons;
