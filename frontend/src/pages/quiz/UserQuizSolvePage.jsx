import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserQuizDetail, submitUserQuiz } from "../../api/userQuizApi";

const UserQuizSolvePage = ({ userData }) => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const userId = userData?.user_id;

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        if (!quizId) throw new Error("퀴즈 ID가 없습니다.");
        const response = await getUserQuizDetail(quizId);
        console.log("✅ 사용자 퀴즈 데이터:", response);

        if (!response || !response.questions || response.questions.length === 0) {
          throw new Error("퀴즈 데이터에 질문이 없습니다.");
        }

        setQuizData(response);
        setAnswers(
          response.questions.map((q) => ({
            questionId: q.userquestion_id,
            userAnswer: "",
          }))
        );
      } catch (err) {
        console.error("🚨 퀴즈 데이터 로딩 실패:", err);
        setError("퀴즈 데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) =>
      prev.map((a) =>
        a.questionId === questionId ? { ...a, userAnswer: value } : a
      )
    );
  };

  const handleSubmit = async () => {
    try {
      if (!userId) {
        alert("로그인이 필요합니다.");
        return;
      }

      const missing = answers.find((a) => !a.userAnswer.trim());
      if (missing) {
        alert("모든 문제에 답해주세요.");
        return;
      }

      setSubmitting(true);
      const payload = {
        user_id: userId,
        userquiz_id: parseInt(quizId),
        answers: answers.map((a) => ({
          question_id: a.questionId,
          user_answer: a.userAnswer,
        })),
      };
      const result = await submitUserQuiz(payload);
      console.log("✅ 제출 결과:", result);

      navigate(`/user-quiz-result/${result.uq_submission_id}`);
    } catch (err) {
      console.error("🚨 제출 실패:", err);
      alert("퀴즈 제출 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="p-6">로딩 중...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="bg-white min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">
          {quizData.title}
        </h2>

        {quizData.content && (
          <p className="text-gray-700 text-center text-lg mb-8 whitespace-pre-wrap">
            {quizData.content}
          </p>
        )}

        <div className="space-y-6">
          {quizData.questions.map((q, index) => (
            <div
              key={q.userquestion_id}
              className="border border-gray-200 shadow-sm rounded-xl p-6"
            >
              <p className="text-lg font-bold text-gray-900 mb-2">
                문제 {index + 1}
              </p>
              <p className="text-gray-800 mb-4">{q.question_text}</p>

              {/* OX 문제 */}
              {q.question_type === 1 && (
                <div className="flex gap-4">
                  {["O", "X"].map((opt) => (
                    <label
                      key={opt}
                      className={`flex items-center gap-2 px-4 py-2 border rounded-full cursor-pointer
                      ${
                        answers.find((a) => a.questionId === q.userquestion_id)?.userAnswer === opt
                          ? "bg-[#A7DA9B] text-white"
                          : "bg-gray-100"
                      }`}
                    >
                      <input
                        type="radio"
                        className="hidden"
                        name={`q-${q.userquestion_id}`}
                        value={opt}
                        checked={
                          answers.find((a) => a.questionId === q.userquestion_id)?.userAnswer === opt
                        }
                        onChange={() => handleAnswerChange(q.userquestion_id, opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}

              {/* 객관식 문제 */}
              {q.question_type === 2 && q.choices && (
                <div className="space-y-2">
                  {q.choices.map((choice, idx) => (
                    <label
                      key={idx}
                      className={`block px-4 py-2 border rounded-lg cursor-pointer
                      ${
                        answers.find((a) => a.questionId === q.userquestion_id)?.userAnswer === choice
                          ? "bg-[#A7DA9B] text-white"
                          : "bg-gray-100"
                      }`}
                    >
                      <input
                        type="radio"
                        className="hidden"
                        name={`q-${q.userquestion_id}`}
                        value={choice}
                        checked={
                          answers.find((a) => a.questionId === q.userquestion_id)?.userAnswer ===
                          choice
                        }
                        onChange={() => handleAnswerChange(q.userquestion_id, choice)}
                      />
                      {choice}
                    </label>
                  ))}
                </div>
              )}

              {/* 단답형 문제 */}
              {q.question_type === 3 && (
                <input
                  type="text"
                  className="w-full mt-2 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#A7DA9B]"
                  placeholder="정답을 입력하세요"
                  value={
                    answers.find((a) => a.questionId === q.userquestion_id)?.userAnswer || ""
                  }
                  onChange={(e) =>
                    handleAnswerChange(q.userquestion_id, e.target.value)
                  }
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <button
            className="px-6 py-2 border border-navbar text-navbar font-semibold rounded-lg hover:bg-[#f1f9f1] transition"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "제출 중..." : "퀴즈 제출하기"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserQuizSolvePage;
