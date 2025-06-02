import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ConfirmRatingLossModal from "./ConfirmRatingLossModal"; // ✅ 새 모달 import
import { markViewedOthers } from "../../api/codingTestApi";     // ✅ API 함수 import 필요

const CodingTestFooterButtons = ({
  problem,
  activeTab,
  handleResetCode,
  handleRunCode,
  handleSubmitCode,
  isSubmitting,
  hasSolvedBefore, // ✅ 부모 컴포넌트에서 props로 받아야 함
}) => {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleViewOthersClick = () => {
    if (hasSolvedBefore) {
      // 이미 푼 사람은 바로 이동
      navigate(`/codingtest/correct/${problem.id}`);
    } else {
      // 처음 푸는 사람 → 경고 모달 띄움
      setShowModal(true);
    }
  };

  const handleConfirm = async () => {
    try {
      await markViewedOthers(problem.id); // 서버에 기록
      navigate(`/codingtest/correct/${problem.id}`);
    } catch (err) {
      alert("처리 중 오류 발생");
    }
  };

  return (
    <>
      {showModal && (
        <ConfirmRatingLossModal
          onConfirm={handleConfirm}
          onCancel={() => setShowModal(false)}
        />
      )}
      {activeTab === "notes" ? (
        <div className="flex gap-2 justify-end items-center p-3 border-t border-gray-600 bg-[#2c3544]">
          <button
            onClick={handleViewOthersClick}
            className="text-xs text-white border border-gray-500 px-3 py-2 rounded hover:bg-gray-600 transition"
          >
            다른 사람의 풀이
          </button>
        </div>
      ) : (
        <div className="flex justify-between items-center p-3 border-t border-gray-600 bg-[#2c3544]">
          <Link
            to="/board/free"
            className="text-xs text-white border border-gray-500 px-3 py-2 rounded hover:bg-gray-600 transition"
          >
            게시판 이동하기
          </Link>

          <div className="flex gap-2">
            <button
              onClick={handleViewOthersClick}
              className="text-xs text-white border border-gray-500 px-3 py-2 rounded hover:bg-gray-600 transition"
            >
              다른 사람의 풀이
            </button>
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
      )}
    </>
  );
};

export default CodingTestFooterButtons;
