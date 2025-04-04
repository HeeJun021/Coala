import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserQuizHistory } from "../api/userQuizApi";
import MyPageSidebar from "../Layout/MyPageSideBar";

const MyPageUserQuizHistory = ({ userData }) => {
  const navigate = useNavigate();
  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    if (!userData?.user_id) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        const data = await getUserQuizHistory(userData.user_id);
        if (!data || data.length === 0) {
          setError("퀴즈 풀이 기록이 없습니다.");
          return;
        }
        setQuizHistory(data);
      } catch (err) {
        console.error("🚨 퀴즈 기록 불러오기 실패:", err);
        setError("퀴즈 기록을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userData]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = quizHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(quizHistory.length / itemsPerPage));

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) return <p>로딩 중...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="w-[250px] shrink-0">
        <MyPageSidebar />
      </div>

      <div className="flex-1 mt-12">
        <h2 className="text-xl font-semibold mb-5">📜 내가 푼 퀴즈 내역</h2>

        {quizHistory.length === 0 ? (
          <p className="text-sm text-gray-500">풀이한 퀴즈가 없습니다.</p>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-4">
            <table className="w-full border-collapse border text-base">
              <thead>
                <tr className="bg-gray-100 text-sm">
                  <th className="border px-4 py-2 text-center">퀴즈 제목</th>
                  <th className="border px-4 py-2 text-center">정답 개수</th>
                  <th className="border px-4 py-2 text-center">제출 날짜</th>
                  <th className="border px-4 py-2 text-center w-[15%]">제작자</th>
                  <th className="border px-4 py-2 text-center">결과 보기</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((quiz) => (
                  <tr key={quiz.uq_submission_id} className="border text-sm">
                    <td className="px-4 py-2 text-center">{quiz.title}</td>
                    <td className="px-4 py-2 text-center">{quiz.correct_count}</td>
                    <td className="px-4 py-2 text-center">
                      {new Date(quiz.submitted_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">{quiz.creator_name}</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        className="px-4 py-2 bg-accent text-white text-sm rounded-lg"
                        onClick={() => navigate(`/user-quiz-result/${quiz.uq_submission_id}`)}
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
                  currentPage === index + 1 ? "bg-accent text-white" : "bg-gray-300 text-gray-700"
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

export default MyPageUserQuizHistory;
