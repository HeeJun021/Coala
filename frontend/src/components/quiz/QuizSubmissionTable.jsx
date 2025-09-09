// frontend/src/components/quiz/QuizSubmissionTable.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserQuizHistory } from "../../api/quizApi";
import { CalendarClock, CheckCircle } from "lucide-react";

const ITEMS_PER_PAGE = 15;

const QuizSubmissionTable = ({ userId }) => {
  const navigate = useNavigate();
  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchQuizHistory = async () => {
      try {
        setLoading(true);
        const response = await getUserQuizHistory(userId);
        const testOnly = response?.filter((q) => q.quiz_type === "test") || [];
        setQuizHistory(testOnly);
      } catch (err) {
        setError("퀴즈 제출 기록을 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchQuizHistory();
  }, [userId]);

  const totalPages = Math.max(1, Math.ceil(quizHistory.length / ITEMS_PER_PAGE));

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return quizHistory.slice(start, start + ITEMS_PER_PAGE);
  }, [quizHistory, currentPage]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 공통 카드 래퍼 (UserQuiz와 동일한 스타일)
  const Card = ({ children, tone = "default" }) => (
    <div
      className={`flex-1 max-w-5xl pt-8 mt-8 mx-auto rounded-2xl border p-7 shadow-xl bg-white ${
        tone === "error" ? "border-red-200" : "border-gray-300"
      }`}
    >
      {children}
    </div>
  );

  if (loading)
    return (
      <Card>
        <h2 className="text-3xl font-extrabold text-gray-800 mb-3 tracking-wide">
          제출 내역
        </h2>
        <p className="text-sm text-gray-500">로딩 중...</p>
      </Card>
    );

  if (error)
    return (
      <Card tone="error">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-3 tracking-wide">
          제출 내역
        </h2>
        <p className="text-sm text-red-600">{error}</p>
      </Card>
    );

  if (quizHistory.length === 0)
    return (
      <Card>
        <h2 className="text-3xl font-extrabold text-gray-800 mb-3 tracking-wide">
          제출 내역
        </h2>
        <p className="text-sm text-gray-500">테스트 퀴즈 제출 기록이 없습니다.</p>
      </Card>
    );

  return (
    <Card>
      {/* 타이틀 */}
      <div className="mb-6">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-2 tracking-wide">
          제출 내역
        </h2>
        <p className="text-gray-500 text-sm">
          지금까지 퀴즈 기록을 조회할 수 있습니다.
        </p>
      </div>

      {/* 표 (UserQuiz와 동일 톤: 헤더 흰 배경, 얇은 보더, 행 hover) */}
      <div className="relative">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="border-b border-gray-300 bg-white text-gray-700 text-sm">
              {/* UserQuiz 테이블 비율에 맞춰 유사 분배 */}
              <th className="p-3 font-medium w-[54%] text-left">제목</th>
              <th className="p-3 font-medium w-[14%]">정답 수</th>
              <th className="p-3 font-medium w-[18%]">제출 시간</th>
              <th className="p-3 font-medium w-[14%]">결과 보기</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((quiz) => (
              <tr
                key={quiz.quiz_id}
                className="hover:bg-gray-200 border-b border-gray-300 cursor-pointer text-sm"
              >
                <td className="p-3 text-left">{quiz.title}</td>
                <td className="p-3 text-green-600">
                  <CheckCircle size={16} className="inline mr-1 align-[-2px]" />
                  {quiz.correct_count} / {quiz.total_questions}
                </td>
                <td className="p-3 text-gray-700">
                  <CalendarClock size={16} className="inline mr-1 align-[-2px]" />
                  {new Date(quiz.submitted_at).toLocaleString("ko-KR")}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => navigate(`/quiz-result/${quiz.quiz_id}`)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-xl shadow-md"
                  >
                    보기
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 페이지네이션 (UserQuiz와 동일한 톤) */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`px-3 py-1 rounded-md border ${
                  currentPage === i + 1
                    ? "bg-green-600 text-white"
                    : "hover:bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default QuizSubmissionTable;
