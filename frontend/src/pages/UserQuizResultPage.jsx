import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserQuizResult } from "../api/userQuizApi";

const UserQuizResultPage = ({ userData }) => {
  const { uq_submission_id } = useParams(); // 변수명 수정
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

  if (loading) return <p>로딩 중...</p>;
  if (error) return <p>{error}</p>;
  if (!quizResult) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">{quizResult.title}</h2>
      <p className="text-sm text-gray-600 mb-6">
        <strong>정답 개수:</strong> {quizResult.correct_count} /{" "}
        {quizResult.questions.length}
      </p>

      {/* 문제별 상세 결과 */}
      {quizResult.questions.map((q, index) => (
        <div
          key={index}
          className={`mb-6 p-4 rounded-xl border-2 ${
            q.is_correct ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
          }`}
        >
          <p className="font-semibold text-lg mb-2">
            문제 {index + 1}{" "}
            {q.question_type === 1
              ? "(O/X)"
              : q.question_type === 2
              ? "(객관식)"
              : "(단답형)"}
          </p>
          <p className="mb-2">{q.question_text}</p>

          <div className="mb-2">
            <span className="font-medium text-gray-700">제출한 정답:</span>{" "}
            <span className={q.is_correct ? "text-green-600" : "text-red-600"}>
              {q.user_answer}
            </span>
          </div>

          <div className="mb-2">
            <span className="font-medium text-gray-700">정답:</span>{" "}
            <span className="text-blue-600">{q.correct_answer}</span>
          </div>

          <div className="mb-2 text-sm text-gray-700">
            <span className="font-medium">해설:</span>{" "}
            {q.explanation || "해설이 제공되지 않았습니다."}
          </div>
        </div>
      ))}

      {/* 버튼 */}
      <div className="mt-6 flex justify-between">
        <button
          className="px-4 py-2 bg-navbar text-white rounded-lg hover:bg-green-600 transition-all"
          onClick={() => navigate(`/user-quiz-solve/${quizResult.userquiz_id}`)}
        >
          다시 풀기
        </button>
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
          onClick={() => navigate("/mypage/userquiz")}
        >
          마이페이지로 이동
        </button>
      </div>
    </div>
  );
};

export default UserQuizResultPage;
