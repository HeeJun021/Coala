import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  RefreshCcw,
  Play,
  Send,
  UsersRound,
  MessageSquareQuote,
} from "lucide-react";
import ConfirmRatingLossModal from "./ConfirmRatingLossModal";
import { markViewedOthers } from "../../api/codingTestApi";

const CodingTestFooterButtons = ({
  problem,
  activeTab,
  handleResetCode,
  handleRunCode,
  handleSubmitCode,
  isSubmitting,
  hasSolvedBefore,
}) => {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleViewOthersClick = () => {
    if (hasSolvedBefore) {
      navigate(`/codingtest/correct/${problem.id}`);
    } else {
      setShowModal(true);
    }
  };

  const handleConfirm = async () => {
    try {
      await markViewedOthers(problem.id);
      navigate(`/codingtest/correct/${problem.id}`);
    } catch (err) {
      alert("처리 중 오류 발생");
    }
  };

  const sharedButton =
    "flex items-center gap-1 text-xs px-3 py-2 rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition";

  return (
    <>
      {showModal && (
        <ConfirmRatingLossModal
          onConfirm={handleConfirm}
          onCancel={() => setShowModal(false)}
        />
      )}

      {activeTab === "notes" ? (
        <div className="flex gap-2 justify-end items-center p-3 border-t border-gray-300 bg-[#f9fafb] shadow">
          <button onClick={handleViewOthersClick} className={sharedButton}>
            <UsersRound size={14} />
            다른 사람의 풀이
          </button>
        </div>
      ) : (
        <div className="flex justify-between items-center p-4 border-t border-gray-300 bg-[#f9fafb] shadow">
          <Link to="/board/free" className={sharedButton}>
            <MessageSquareQuote size={14} color="#4b5563" />
            게시판 이동하기
          </Link>

          <div className="flex gap-2">
            <button onClick={handleViewOthersClick} className={sharedButton}>
              <UsersRound size={14} color="#2563eb" />
              다른 사람의 풀이
            </button>
            <button onClick={handleResetCode} className={sharedButton}>
              <RefreshCcw size={14} color="#d97706" />
              초기화
            </button>
            <button
              onClick={handleRunCode}
              disabled={!problem}
              className={`${sharedButton} ${
                !problem ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Play size={14} color="#4f46e5" strokeWidth={2.5} />
              테스트케이스 실행
            </button>
            <button
              onClick={handleSubmitCode}
              disabled={!problem || isSubmitting}
              className={`flex items-center gap-1 text-xs px-3 py-2 rounded transition text-white ${
                !problem || isSubmitting
                  ? "bg-teal-300 cursor-not-allowed opacity-50"
                  : "bg-teal-500 hover:bg-teal-600"
              }`}
            >
              <Send size={14} color="#ffffff" />
              {isSubmitting ? "채점 중..." : "코드 제출 후 채점"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CodingTestFooterButtons;
