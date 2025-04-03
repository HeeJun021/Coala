import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllUserQuizzes } from "../api/userQuizApi";
import QuizSideBar from "../Layout/QuizSideBar";

const UserQuiz = ({ userData }) => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async (searchTerm = "") => {
    try {
      const data = await getAllUserQuizzes(searchTerm);
      setQuizzes(data);
      setCurrentPage(1);
    } catch (err) {
      console.error("퀴즈 목록 불러오기 실패:", err);
    }
  };

  const handleSearch = async () => {
    await fetchQuizzes(search);
  };

  const handleQuizClick = (quizId) => {
    navigate(`/user-quiz-solve/${quizId}`);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = quizzes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(quizzes.length / itemsPerPage));

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="flex w-full">
      {/* ✅ 사이드바 */}
      <QuizSideBar />

      {/* ✅ 콘텐츠 */}
      <div className="flex-1 max-w-5xl pt-12 mx-auto">
        <h2 className="text-2xl mb-6 font-semibold flex items-center gap-2">
          📄 사용자 퀴즈 목록
        </h2>

        {/* 검색 */}
        <div className="flex pb-4 pt-4 mb-4 gap-2">
          <input
            type="text"
            placeholder="작성자 이름 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 flex-1"
          />
          <button
            onClick={handleSearch}
            className="bg-navbar text-white px-4 py-2 rounded"
          >
            검색
          </button>
        </div>

        {/* 목록 */}
        {currentItems.length === 0 ? (
          <p className="text-sm text-gray-500">퀴즈가 없습니다.</p>
        ) : (
          <div className="relative">
            <table className="w-full border-collapse border text-sm bg-white shadow-md rounded-lg">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-6 py-3 text-center w-[54%]">제목</th>
                  <th className="border px-6 py-3 text-center w-[18%]">작성자</th>
                  <th className="border px-6 py-3 text-center w-[14%]">생성일</th>
                  <th className="border px-6 py-3 text-center w-[14%]">조회수</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((quiz) => (
                  <tr
                    key={quiz.userquiz_id}
                    className="border cursor-pointer hover:bg-gray-50"
                    onClick={() => handleQuizClick(quiz.userquiz_id)}
                  >
                    <td className="px-6 py-3 text-left">{quiz.title}</td>
                    <td className="px-6 py-3 text-center">{quiz.nickname}</td>
                    <td className="px-6 py-3 text-center">
                      {new Date(quiz.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-center">{quiz.submission_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                {Array.from({ length: totalPages }, (_, index) => (
                  <span
                    key={index}
                    onClick={() => handlePageChange(index + 1)}
                    className={`cursor-pointer px-3 py-1 rounded ${
                      currentPage === index + 1
                        ? "bg-navbar text-white font-bold"
                        : "text-gray-700"
                    }`}
                  >
                    {index + 1}
                  </span>
                ))}
              </div>
            )}

            {/* 버튼 */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => navigate("/user-quiz/create")}
                className="bg-accent text-white px-4 py-2 rounded"
              >
                퀴즈 만들기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserQuiz;
