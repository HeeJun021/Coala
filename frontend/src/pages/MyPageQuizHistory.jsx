import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getUserQuizHistory } from "../api/quizApi";
import MyPageSidebar from "../Layout/MyPageSideBar";
import {
  ScrollText,
  Target,
  PencilLine,
  ArrowDownUp,
  CalendarClock,
  CheckCircle,
} from "lucide-react";

const MyPageQuizHistory = () => {
  const navigate = useNavigate();
  const { userData } = useOutletContext();

  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!userData?.user_id) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    const fetchQuizHistory = async () => {
      try {
        const response = await getUserQuizHistory(userData.user_id);
        if (!response || response.length === 0) {
          setError("퀴즈 기록이 없습니다.");
          return;
        }
        setQuizHistory(response);
      } catch (err) {
        setError("퀴즈 기록을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizHistory();
  }, [userData]);

  if (loading) return <p>로딩 중...</p>;
  if (error) return <p>{error}</p>;

  const filteredHistory = quizHistory.filter((quiz) => {
    if (filter === "all") return true;
    if (filter === "practice") return quiz.quiz_type === "practice";
    if (filter === "test") return quiz.quiz_type === "test";
    return true;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / itemsPerPage));

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const toggleFilter = () => {
    if (filter === "all") setFilter("practice");
    else if (filter === "practice") setFilter("test");
    else setFilter("all");
    setCurrentPage(1);
  };

  const renderQuizTypeIcon = () => {
    if (filter === "all") return <ArrowDownUp size={16} className="inline text-gray-500" />;
    if (filter === "practice") return <Target size={16} className="inline text-green-500" />;
    if (filter === "test") return <PencilLine size={16} className="inline text-blue-500" />;
  };

  return (
    <div className="flex min-h-screen">
      <div className="w-[250px]">
      </div>
      <div className="flex-1 p-6 max-w-6xl mx-auto">
        <h2 className="text-xl font-semibold mt-4 flex items-center gap-2">
          <ScrollText size={20} className="text-green-600" />
          퀴즈 풀이 내역
        </h2>

        {filteredHistory.length === 0 ? (
          <p className="text-sm text-gray-500">해당 유형의 퀴즈 기록이 없습니다.</p>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-4 mt-4">
            <table className="w-full border-collapse border text-base">
              <thead>
                <tr className="bg-gray-100 text-sm">
                  <th className="border px-4 py-2 text-center">퀴즈 제목</th>
                  <th
                    className="border px-4 py-2 text-center cursor-pointer select-none"
                    onClick={toggleFilter}
                  >
                    퀴즈 유형 {renderQuizTypeIcon()}
                  </th>
                  <th className="border px-4 py-2 text-center">정답 개수</th>
                  <th className="border px-4 py-2 text-center">제출 날짜</th>
                  <th className="border px-4 py-2 text-center">레이팅 변화</th>
                  <th className="border px-4 py-2 text-center">결과 보기</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((quiz) => (
                  <tr key={quiz.quiz_id} className="border text-sm">
                    <td className="px-4 py-2 text-center">{quiz.title}</td>

                    <td className="px-4 py-2 text-center">
                      {quiz.quiz_type === "test" ? "테스트" : "연습"}
                    </td>

                    <td className="px-4 py-2 text-center">
                      <div className="inline-flex items-center justify-center gap-1 text-green-600">
                        <CheckCircle size={16} />
                        {quiz.correct_count} / {quiz.total_questions}
                      </div>
                    </td>

                    <td className="px-4 py-2 text-center">
                      <div className="inline-flex items-center justify-center gap-1 text-gray-700">
                        <CalendarClock size={16} />
                        {new Date(quiz.submitted_at).toLocaleString()}
                      </div>
                    </td>

                    <td className="px-4 py-2 text-center font-normal">
                      {quiz.quiz_type === "test" ? (
                        quiz.rating_change !== 0 ? (
                          <span className={quiz.rating_change > 0 ? "text-green-500" : "text-red-500"}>
                            {quiz.rating_change > 0 ? `+${quiz.rating_change}` : quiz.rating_change}
                          </span>
                        ) : (
                          "-"
                        )
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="px-4 py-2 text-center">
                      <button
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg"
                        onClick={() => navigate(`/quiz-result/${quiz.quiz_id}`)}
                      >
                        보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center mt-6 space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              className={`px-3 py-2 rounded-lg ${
                currentPage === 1 ? "bg-gray-300 text-gray-600" : "bg-accent text-white"
              }`}
              disabled={currentPage === 1}
            >
              ◀
            </button>
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === index + 1
                    ? "bg-accent text-white"
                    : "bg-gray-300 text-gray-700"
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              className={`px-3 py-2 rounded-lg ${
                currentPage === totalPages ? "bg-gray-300 text-gray-600" : "bg-accent text-white"
              }`}
              disabled={currentPage === totalPages}
            >
              ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPageQuizHistory;
