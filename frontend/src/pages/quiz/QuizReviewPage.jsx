// src/pages/QuizReviewPage.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getIncorrectQuestions, createRetakeQuiz } from "../../api/quizApi";

import QuizSideBar from "../../Layout/QuizSideBar";
import LanguageFilter from "../../components/quiz/LanguageFilter";
import RetakeQuizForm from "../../components/quiz/RetakeQuizForm";
import IncorrectQuestionList from "../../components/quiz/IncorrectQuestionList";

export default function QuizReviewPage() {
  const [allQuestions, setAllQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // 1) 전체 오답 목록 불러오기
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await getIncorrectQuestions();
        setAllQuestions(data || []);
        setFilteredQuestions(data || []);
      } catch (e) {
        console.error(e);
        setError("오답 목록을 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  // 2) 언어별 필터링
  useEffect(() => {
    if (selectedLanguage === null) {
      setFilteredQuestions(allQuestions);
    } else {
      setFilteredQuestions(
        allQuestions.filter((q) => q.language_id === selectedLanguage)
      );
    }
  }, [selectedLanguage, allQuestions]);

  // 3) 복습 퀴즈 생성 후 Solve 페이지로 이동
  const handleStartQuiz = async (count, languageId) => {
    try {
      const newQuiz = await createRetakeQuiz({
        title: "나의 오답 복습 퀴즈",
        quiz_type: "review", // 타입 구분을 확실히
        count,
        language_id: languageId,
      });

      if (newQuiz && newQuiz.quiz_id) {
        // 올바른 라우트로 이동
        navigate(`/quizsolve/${newQuiz.quiz_id}`);
      }
    } catch (e) {
      console.error("복습 퀴즈 생성 실패:", e);
      alert("복습 퀴즈 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <div className="flex w-full">
      <QuizSideBar />

      <div className="flex-1 max-w-6xl pt-8 mt-8 mx-auto bg-white shadow-xl rounded-2xl border border-gray-300 p-7 relative">
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

        {/* 언어 선택 */}
        <LanguageFilter onSelectLanguage={setSelectedLanguage} />

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
