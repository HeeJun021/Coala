// src/components/quiz/QuizSubmissionTable.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserQuizHistory } from "../../api/quizApi";
import { CalendarClock, CheckCircle } from "lucide-react";

const QuizSubmissionTable = ({ userId }) => {
  const navigate = useNavigate();
  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    const fetchQuizHistory = async () => {
      try {
        const response = await getUserQuizHistory(userId);
        const testOnly = response?.filter(q => q.quiz_type === "test") || [];
        setQuizHistory(testOnly);
      } catch (err) {
        setError("퀴즈 제출 기록을 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchQuizHistory();
  }, [userId]);

  if (loading) return <p className="text-sm text-gray-500 mt-4">로딩 중...</p>;
  if (error) return <p className="text-sm text-red-500 mt-4">{error}</p>;
  if (quizHistory.length === 0)
    return <p className="text-sm text-gray-500 mt-4">테스트 퀴즈 제출 기록이 없습니다.</p>;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = quizHistory.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.max(1, Math.ceil(quizHistory.length / itemsPerPage));

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-10 max-w-screen-lg mx-auto">
      <h2 className="text-lg font-semibold mb-4">퀴즈 제출 내역</h2>
      <table className="w-full border-collapse border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2 text-center">제목</th>
            <th className="border px-4 py-2 text-center">정답 수</th>
            <th className="border px-4 py-2 text-center">제출 시간</th>
            <th className="border px-4 py-2 text-center">결과 보기</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((quiz) => (
            <tr key={quiz.quiz_id} className="border text-sm">
              <td className="px-4 py-2 text-center">{quiz.title}</td>
              <td className="px-4 py-2 text-center text-green-600">
                <CheckCircle size={16} className="inline mr-1" />
                {quiz.correct_count} / {quiz.total_questions}
              </td>
              <td className="px-4 py-2 text-center text-gray-700">
                <CalendarClock size={16} className="inline mr-1" />
                {new Date(quiz.submitted_at).toLocaleString()}
              </td>
              <td className="px-4 py-2 text-center">
                <button
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
                  onClick={() => navigate(`/quiz-result/${quiz.quiz_id}`)}
                >
                  보기
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg bg-gray-300 text-gray-600"
          >
            ◀
          </button>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-4 py-2 rounded-lg ${
                currentPage === index + 1
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg bg-gray-300 text-gray-600"
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizSubmissionTable;
