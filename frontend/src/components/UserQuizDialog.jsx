import React from "react";
import { useNavigate } from "react-router-dom";

const UserQuizDialog = ({ onClose }) => {
  const navigate = useNavigate();

  const handleGoToList = () => {
    navigate("/quizpage?category=user");
  };

  const handleSolveQuiz = () => {
    navigate("/quiz/solve-user-quiz");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col gap-3 w-[300px]">
        <h2 className="text-xl font-semibold text-center mb-4">
          퀴즈가 생성되었습니다
        </h2>
        <button
          onClick={handleGoToList}
          className="bg-gray-400 text-white py-2 px-3 rounded text-sm hover:bg-navbar transition-colors"
        >
          목록 보기
        </button>
        <button
          onClick={handleSolveQuiz}
          className="bg-gray-400 text-white py-2 px-3 rounded text-sm hover:bg-navbar transition-colors"
        >
          풀어보기
        </button>
      </div>
    </div>
  );
};

export default UserQuizDialog;
