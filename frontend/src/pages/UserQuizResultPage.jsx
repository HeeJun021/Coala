import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserQuizResult } from "../api/userQuizApi";

const UserQuizResultPage = ({ userData }) => {
  const { uq_submission_id } = useParams();
  const navigate = useNavigate();
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuizResult = async () => {
      if (!userData?.user_id) {
        setError("로그인이 필요합니다.");
        return;
      }

      try {
        const response = await getUserQuizResult(uq_submission_id);
        console.log("✅ 사용자 퀴즈 결과:", response);
        setQuizResult(response);
      } catch (err) {
        console.error("🚨 퀴즈 결과 불러오기 실패:", err);
        setError("퀴즈 결과를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizResult();
  }, [uq_submission_id, userData]);

  if (loading) return <p className="p-6">로딩 중...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;
  if (!quizResult) return null;

  return (
    <div className="bg-white min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
          {quizResult.title}
        </h2>
        <p className="text-center text-gray-700 text-lg mb-8">
          정답 개수: {quizResult.correct_count} / {quizResult.questions.length}
        </p>

        <div className="space-y-6">
          {quizResult.questions.map((q, index) => (
            <div
              key={index}
              className={`border shadow-sm rounded-xl p-6 ${
                q.is_correct ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
              }`}
            >
              <p className="text-lg font-bold text-gray-900 mb-2">
                문제 {index + 1}{" "}
                {q.question_type === 1
                  ? "(O/X)"
                  : q.question_type === 2
                  ? "(객관식)"
                  : "(단답형)"}
              </p>
              <p className="text-gray-800 mb-3">{q.question_text}</p>

              <div className="mb-2 text-sm">
                <span className="font-medium text-gray-700">제출한 정답: </span>
                <span className={q.is_correct ? "text-green-600" : "text-red-600"}>
                  {q.user_answer}
                </span>
              </div>

              <div className="mb-2 text-sm">
                <span className="font-medium text-gray-700">정답: </span>
                <span className="text-blue-600">{q.correct_answer}</span>
              </div>

              <div className="text-sm text-gray-700">
                <span className="font-medium">해설:</span>{" "}
                {q.explanation || "해설이 제공되지 않았습니다."}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center gap-4">
          <button
            className="px-6 py-2 border border-navbar text-navbar font-semibold rounded-lg hover:bg-[#f1f9f1] transition"
            onClick={() => navigate(`/user-quiz-solve/${quizResult.userquiz_id}`)}
          >
            다시 풀기
          </button>
          <button
            className="px-6 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
            onClick={() => navigate("/mypage/userquiz-history")}
          >
            마이페이지로 이동
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserQuizResultPage;
