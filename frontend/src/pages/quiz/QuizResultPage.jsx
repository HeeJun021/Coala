import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQuizResult } from "../../api/quizApi";
import { ShieldCheck, Lightbulb, ChevronLeft } from "lucide-react";

const QuizResultPage = ({ userData }) => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuizResult = async () => {
      if (!userData?.user_id) {
        setError("로그인이 필요합니다.");
        setLoading(false);
        return;
      }
      try {
        const response = await getQuizResult(quizId, userData.user_id);
        setQuizResult(response);
      } catch (err) {
        console.error("퀴즈 결과 불러오기 실패:", err);
        setError("퀴즈 결과를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuizResult();
  }, [quizId, userData]);

  if (loading) return <p className="p-6">로딩 중...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="bg-white min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto relative">

        {/* ⬅️ 뒤로가기 버튼 (메타 톤) */}
        <button
          className="absolute top-0 left-0 flex items-center gap-1 text-gray-600 hover:text-gray-800 text-sm"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="w-5 h-5" />
          뒤로가기
        </button>

        {/* 페이지 타이틀: ContentTitle 규격 → text-2xl */}
        <h2 className="text-2xl font-bold text-center mb-3 text-gray-800">
          {quizResult.title}
        </h2>

        {/* 퀴즈 유형/제출 시간: 본문/메타 톤 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-1">
            {quizResult.quiz_type === "test" ? (
              <ShieldCheck size={20} className="text-blue-500" />
            ) : (
              <Lightbulb size={20} className="text-yellow-400" />
            )}
            <p className="text-sm text-gray-800">
              <strong>퀴즈 유형:</strong>{" "}
              {quizResult.quiz_type === "test" ? "퀴즈 테스트" : "연습 퀴즈"}
            </p>
          </div>
          <p className="text-xs text-gray-500">
            <strong>제출 시간:</strong>{" "}
            {new Date(quizResult.submitted_at).toLocaleString()}
          </p>
        </div>

        {/* 문제 목록 */}
        <div className="space-y-6">
          {quizResult.questions.map((q, index) => (
            <div
              key={q.question_id}
              className="relative border border-gray-200 shadow-sm rounded-xl p-6"
            >
              {/* 좌측 색 바 */}
              <div
                className={`absolute top-0 left-0 h-full w-2 rounded-l-xl ${
                  q.is_correct ? "bg-green-400" : "bg-red-400"
                }`}
              />

              <div className="pl-4">
                {/* 섹션 제목 규격: text-base font-semibold */}
                <p className="text-base font-semibold text-gray-900 mb-2">
                  문제 {index + 1}
                </p>

                {/* 본문: text-sm leading-relaxed */}
                <p className="text-sm text-gray-800 leading-relaxed mb-3">
                  {q.question_text}
                </p>

                {/* 제출/정답/설명: 본문/메타 톤 통일 */}
                <div className="mb-2 text-sm">
                  <span className="font-medium text-gray-700">제출한 정답:</span>{" "}
                  <span className={q.is_correct ? "text-green-600" : "text-red-600"}>
                    {q.user_answer}
                  </span>
                </div>

                <div className="mb-2 text-sm">
                  <span className="font-medium text-gray-700">정답:</span>{" "}
                  <span className="text-blue-600">{q.correct_answer}</span>
                </div>

                <div className="text-sm text-gray-700">
                  <span className="font-medium">설명:</span>{" "}
                  {q.explanation || "설명이 제공되지 않았습니다."}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 테스트 타입일 때 레이팅: 섹션급 강조 → text-base */}
        {quizResult.quiz_type === "test" && (
          <div className="mt-10 text-center text-base font-semibold">
            획득 레이팅:{" "}
            <span
              className={
                quizResult.rating_change > 0
                  ? "text-green-600"
                  : quizResult.rating_change < 0
                  ? "text-red-600"
                  : "text-gray-600"
              }
            >
              {quizResult.rating_change > 0
                ? `+${quizResult.rating_change}`
                : quizResult.rating_change}
            </span>{" "}
            점
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="mt-10 flex justify-center gap-4">
          <button
            className="px-5 py-2 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 shadow inline-flex items-center gap-2"
            onClick={() => navigate(`/quizpage?mode=${quizResult.quiz_type}`)}
          >
            다시 풀기
          </button>
          <button
            className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
            onClick={() => navigate("/mypage/quiz-history")}
          >
            마이페이지로 이동
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResultPage;
