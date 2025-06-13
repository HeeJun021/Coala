import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAllUserQuizzes } from "../api/userQuizApi";
import QuizSideBar from "../Layout/QuizSideBar";
import { FaSearch, FaTimes } from "react-icons/fa";
import { HelpCircle } from "lucide-react";
import QuizGuideModal from "../components/quiz/QuizGuideModal";

const UserQuiz = ({ userData }) => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [search, setSearch] = useState("");
  const [myOnly, setMyOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [showGuideTooltip, setShowGuideTooltip] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("quiz_guide_seen");
    if (seen !== "true") setShowGuideTooltip(true);
  }, []);

  const handleGuideClick = () => {
    setIsGuideOpen(true);
    setShowGuideTooltip(false);
    localStorage.setItem("quiz_guide_seen", "true");
  };

  const fetchAllQuizzes = useCallback(async () => {
    try {
      const data = await getAllUserQuizzes(search, null);
      setQuizzes(data);
      setCurrentPage(1);
    } catch (err) {
      console.error("전체 퀴즈 불러오기 실패:", err);
    }
  }, [search]);

  const fetchMyQuizzes = async () => {
    if (!userData?.user_id) return;
    try {
      const data = await getAllUserQuizzes("", userData.user_id);
      setQuizzes(data);
      setSearch("");
      setCurrentPage(1);
    } catch (err) {
      console.error("내 퀴즈 불러오기 실패:", err);
    }
  };

  const handleToggleMyOnly = async () => {
    const next = !myOnly;
    setMyOnly(next);
    if (next) await fetchMyQuizzes();
    else await fetchAllQuizzes();
  };

  const handleSearch = async () => {
    if (myOnly) await fetchMyQuizzes();
    else await fetchAllQuizzes();
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
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    fetchAllQuizzes();
  }, [fetchAllQuizzes]);

  return (
    <div className="flex w-full">
      <QuizSideBar />

      <div className="flex-1 max-w-6xl pt-8 mt-8 mx-auto bg-white shadow-xl rounded-2xl border border-gray-300 p-7 relative">
        {/* 🟢 가이드 버튼 */}
        <button
          onClick={handleGuideClick}
          className="absolute top-4 right-4 text-gray-500 hover:text-black"
          title="가이드 보기"
        >
          <HelpCircle size={24} />
          {showGuideTooltip && (
            <div className="absolute top-[-2px] right-[-6px] w-[7px] h-[7px] bg-rose-600 rounded-full shadow-sm" />
          )}
        </button>

        {/* 타이틀 */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-4 tracking-wide">
            <span className="text-black">퀴즈 만들어보기</span>
          </h1>
          <p className="text-gray-500 text-sm">
            다른 사용자가 만든 퀴즈를 풀어보며{" "}
            <span className="font-medium text-gray-700">사고력과 이해력</span>을 키워보세요!
          </p>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex flex-col gap-2 mb-4">
          <h2 className="text-lg font-medium text-gray-700 mb-2">퀴즈 검색 및 필터링</h2>
          <div
            className={`flex items-center border rounded-md w-[500px] bg-white px-2 ${
              search
                ? "border-green-500"
                : "border-gray-300 hover:border-green-500 focus-within:border-green-500"
            }`}
          >
            <input
              type="text"
              placeholder="퀴즈 제목 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={myOnly}
              className="px-2 py-2 w-full outline-none bg-white"
            />
            {search && (
              <FaTimes
                className="text-gray-400 cursor-pointer mx-2"
                onClick={() => {
                  setSearch("");
                  fetchAllQuizzes();
                }}
              />
            )}
            <FaSearch
              className="text-gray-500 cursor-pointer"
              onClick={handleSearch}
            />
          </div>

          <div className="mt-2">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={myOnly}
                onChange={handleToggleMyOnly}
                className="appearance-none w-5 h-5 border border-gray-400 rounded-sm checked:bg-green-600 checked:border-transparent mr-2"
              />
              <span className="text-sm text-gray-700">내가 만든 퀴즈만 보기</span>
            </label>
          </div>
        </div>

        {/* 퀴즈 목록 */}
        {currentItems.length === 0 ? (
          <p className="text-sm text-gray-500">퀴즈가 없습니다.</p>
        ) : (
          <div className="relative">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="border-b border-gray-300 bg-white text-gray-700 text-sm">
                  <th className="p-3 font-medium w-[54%] text-left">제목</th>
                  <th className="p-3 font-medium w-[18%]">작성자</th>
                  <th className="p-3 font-medium w-[14%]">생성일</th>
                  <th className="p-3 font-medium w-[14%]">풀이 수</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((quiz) => (
                  <tr
                    key={quiz.userquiz_id}
                    className="hover:bg-gray-200 border-b border-gray-300 cursor-pointer text-sm"
                    onClick={() => handleQuizClick(quiz.userquiz_id)}
                  >
                    <td className="p-3 text-left">{quiz.title}</td>
                    <td className="p-3">{quiz.nickname}</td>
                    <td className="p-3">
                      {new Date(quiz.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">{quiz.submission_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 페이지네이션 */}
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
        )}

        {/* 퀴즈 만들기 버튼 */}
        <div className="flex justify-end mt-6">
          <button
            onClick={() => navigate("/user-quiz/create")}
            className="px-6 py-2 bg-green-600 text-white rounded-xl shadow-md hover:bg-green-700 transition-all"
          >
            퀴즈 만들기
          </button>
        </div>
      </div>

      {/* 가이드 모달 */}
      {isGuideOpen && (
        <QuizGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      )}
    </div>
  );
};

export default UserQuiz;
