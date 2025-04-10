import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllUserQuizzes } from "../api/userQuizApi";
import QuizSideBar from "../Layout/QuizSideBar";

const UserQuiz = ({ userData }) => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [search, setSearch] = useState("");
  const [myOnly, setMyOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // ✅ 전체 퀴즈 가져오기
  const fetchAllQuizzes = async () => {
    try {
      const data = await getAllUserQuizzes(search, null);
      setQuizzes(data);
      setCurrentPage(1);
    } catch (err) {
      console.error("전체 퀴즈 불러오기 실패:", err);
    }
  };

  // ✅ 내 퀴즈만 가져오기
  const fetchMyQuizzes = async () => {
    if (!userData?.user_id) {
      console.warn("❌ user_id 없음!");
      return;
    }
    try {
      const data = await getAllUserQuizzes("", userData.user_id);
      setQuizzes(data);
      setSearch(""); // 검색창 초기화
      setCurrentPage(1);
    } catch (err) {
      console.error("내 퀴즈 불러오기 실패:", err);
    }
  };

  // ✅ 체크박스 토글 처리
  const handleToggleMyOnly = async () => {
    const next = !myOnly;
    console.log("🟨 체크박스 클릭됨, 다음 상태:", next);
    setMyOnly(next);
    if (next) {
      await fetchMyQuizzes();
    } else {
      await fetchAllQuizzes();
    }
  };

  // ✅ 수동 검색
  const handleSearch = async () => {
    if (myOnly) {
      await fetchMyQuizzes();
    } else {
      await fetchAllQuizzes();
    }
  };

  // ✅ 퀴즈 클릭
  const handleQuizClick = (quizId) => {
    navigate(`/user-quiz-solve/${quizId}`);
  };

  // ✅ 페이지네이션
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = quizzes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(quizzes.length / itemsPerPage));

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  
  // ✅ 첫 로딩 시 전체 퀴즈 불러오기
  useEffect(() => {
    fetchAllQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex w-full">
      {/* ✅ 사이드바 */}
      <QuizSideBar />

      {/* ✅ 콘텐츠 */}
      <div className="flex-1 max-w-5xl pt-12 mx-auto">
        <h2 className="text-2xl mb-6 font-semibold flex items-center gap-2">
          📄 사용자 퀴즈 목록
        </h2>

        {/* 🔍 검색바 */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="퀴즈 제목 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 flex-1"
            disabled={myOnly}
          />
          <button
            onClick={handleSearch}
            className="bg-navbar text-white px-4 py-2 rounded"
            disabled={myOnly}
          >
            검색
          </button>
        </div>

        {/* ✅ 내가 만든 퀴즈만 보기 */}
        <div className="mt-3 mb-6">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={myOnly}
              onChange={handleToggleMyOnly}
              className="appearance-none w-5 h-5 border border-gray-400 rounded-sm checked:bg-accent checked:border-transparent mr-2"
            />
            <span className="text-sm text-gray-700">내가 만든 퀴즈만 보기</span>
          </label>
        </div>

        {/* 📋 퀴즈 목록 */}
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
                  <th className="border px-6 py-3 text-center w-[14%]">풀이 수</th>
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
          </div>
        )}

        {/* ➕ 퀴즈 만들기 (항상 표시) */}
        <div className="flex justify-end mt-6">
          <button
            onClick={() => navigate("/user-quiz/create")}
            className="bg-accent text-white px-4 py-2 rounded"
          >
            퀴즈 만들기
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserQuiz;
