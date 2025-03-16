import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQuizResult } from "../api/quizApi";

const QuizResultPage = ({ userData }) => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ 퀴즈 결과 데이터 가져오기
  useEffect(() => {
    const fetchQuizResult = async () => {
      if (!userData?.user_id) {
        setError("로그인이 필요합니다.");
        return;
      }

      try {
        const response = await getQuizResult(quizId, userData.user_id); // ✅ user_id 추가
        console.log("✅ 퀴즈 결과 데이터:", response);
        setQuizResult(response);
      } catch (err) {
        console.error("🚨 퀴즈 결과 불러오기 실패:", err);
        setError("퀴즈 결과를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizResult();
  }, [quizId, userData]);

  if (loading) return <p>로딩 중...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">{quizResult.title}</h2>
      <p className="text-lg mb-2">
        <strong>퀴즈 유형:</strong>{" "}
        {quizResult.quiz_type === "test" ? "📝 퀴즈 테스트" : "🎯 연습 퀴즈"}
      </p>
      <p className="text-sm text-gray-600">
        <strong>제출 시간:</strong> {new Date(quizResult.submitted_at).toLocaleString()}
      </p>

      {/* ✅ 문제 및 정답 비교 테이블 */}
      <div className="mt-6 bg-white shadow-md rounded-lg p-4">
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">문제</th>
              <th className="border px-4 py-2">내 답</th>
              <th className="border px-4 py-2">정답</th>
              <th className="border px-4 py-2">결과</th>
            </tr>
          </thead>
          <tbody>
            {quizResult.questions.map((q, index) => (
              <tr key={q.question_id} className="border">
                <td className="px-4 py-2">{`${index + 1}. ${q.question_text}`}</td>
                <td className="px-4 py-2">{q.user_answer}</td>
                <td className="px-4 py-2">{q.correct_answer}</td>
                <td className="px-4 py-2 text-center">
                  {q.is_correct ? "✅" : "❌"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ 레이팅 변화 표시 (테스트 모드일 경우) */}
      {quizResult.quiz_type === "test" && (
        <div className="mt-4 text-lg font-semibold">
          <p>획득 레이팅: <span className="text-blue-600">{quizResult.rating_change}</span>점</p>
        </div>
      )}

      {/* ✅ 버튼: 다시 풀기 & 마이페이지 이동 */}
      <div className="mt-6 flex justify-between">
        <button
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
          onClick={() => navigate(`/quizpage?mode=${quizResult.quiz_type}`)} 
        >
          다시 풀기
        </button>
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
          onClick={() => navigate("/mypage/quiz-history")} // ✅ 마이페이지 이동 (test/practice 동일)
        >
          마이페이지로 이동
        </button>
      </div>
    </div>
  );
};

export default QuizResultPage;
