// src/pages/QuizReviewPage.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getIncorrectQuestions, createRetakeQuiz } from "../../api/quizApi";

import QuizSideBar from "../../Layout/QuizSideBar";
import LanguageFilter from "../../components/quiz/LanguageFilter";
import RetakeQuizForm from "../../components/quiz/RetakeQuizForm";
import IncorrectQuestionList from "../../components/quiz/IncorrectQuestionList";
import { Filter } from "lucide-react";

export default function QuizReviewPage() {
  const [allQuestions, setAllQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [sortOption, setSortOption] = useState("recent"); // ✅ 정렬 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // 1) 전체 오답 목록 불러오기
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await getIncorrectQuestions();
        setAllQuestions(data || []);
      } catch (e) {
        console.error(e);
        setError("오답 목록을 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  // 2) 언어별 + 정렬 적용
  useEffect(() => {
    let list =
      selectedLanguage === null
        ? allQuestions
        : allQuestions.filter((q) => q.language_id === selectedLanguage);

  if (sortOption === "recent") {
    list = [...list].sort(
      (a, b) => new Date(b.last_incorrect_at) - new Date(a.last_incorrect_at)
    );
  } else if (sortOption === "incorrect") {
    list = [...list].sort((a, b) => b.incorrect_attempts - a.incorrect_attempts);
  }

    setFilteredQuestions(list);
  }, [selectedLanguage, allQuestions, sortOption]);

  // 3) 복습 퀴즈 생성 후 Solve 페이지로 이동
  const handleStartQuiz = async (count, languageId) => {
    try {
      const newQuiz = await createRetakeQuiz({
        title: "나의 오답 복습 퀴즈",
        quiz_type: "review",
        count,
        language_id: languageId,
      });

      if (newQuiz && newQuiz.quiz_id) {
        navigate(`/quizsolve/${newQuiz.quiz_id}?mode=review`);
      }
    } catch (e) {
      console.error("복습 퀴즈 생성 실패:", e);
      alert("복습 퀴즈 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <div className="w-full min-h-screen pt-4 pl-[164px]">
      {/* 좌측 사이드바 */}
      <QuizSideBar />

      {/* 본문 카드 */}
      <div className="max-w-6xl mx-auto pt-8 mt-8 bg-white shadow-xl rounded-2xl border border-gray-300 p-7 relative">
        {/* 타이틀 */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-4 tracking-wide">
            <span className="text-black">오답 노트</span>
          </h1>
          <p className="text-gray-500 text-sm">
            틀렸던 문제를 언어별로 확인하고 원하는 개수만큼{" "}
            <span className="font-medium text-gray-700">복습 퀴즈</span>로 풀어보세요.
          </p>
        </div>

{/* 언어 선택 + 정렬 옵션 한 줄 배치 */}
<div className="flex justify-between items-center">
  <LanguageFilter onSelectLanguage={setSelectedLanguage} />

  <div className="flex gap-2 mb-4">
    <button
      onClick={() => setSortOption("recent")}
      className={`px-3 py-1.5 rounded-full text-[13px] font-medium border transition ${
        sortOption === "recent"
          ? "bg-green-600 text-white border-green-600"
          : "text-green-700 border-green-400 hover:bg-green-50"
      }`}
    >
      최근 푼 문제
    </button>
    <button
      onClick={() => setSortOption("incorrect")}
      className={`px-3 py-1.5 rounded-full text-[13px] font-medium border transition ${
        sortOption === "incorrect"
          ? "bg-green-600 text-white border-green-600"
          : "text-green-700 border-green-400 hover:bg-green-50"
      }`}
    >
      많이 틀린 문제
    </button>
  </div>
</div>


        {/* 복습 퀴즈 시작 폼 */}
        <RetakeQuizForm
          totalQuestions={filteredQuestions.length}
          languageId={selectedLanguage ?? 1}
          onStartQuiz={handleStartQuiz}
        />

        {/* 오답 문제 리스트 */}
        {loading ? (
          <p className="text-sm text-gray-500">로딩 중...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <IncorrectQuestionList questions={filteredQuestions} />
        )}
      </div>
    </div>
  );
}
