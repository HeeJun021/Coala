import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getQuizDetails, submitQuiz } from "../../api/quizApi";

const QuizSolvePage = ({ userData }) => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const mode = queryParams.get("mode") || "practice";

  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const userId = userData?.user_id;

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        if (!quizId) throw new Error("퀴즈 ID가 없습니다.");

        const response = await getQuizDetails(quizId);
        console.log("✅ 퀴즈 데이터 가져오기 성공:", response);

        if (!response || !response.questions || response.questions.length === 0) {
          throw new Error("퀴즈 데이터에 질문이 없습니다.");
        }

        setQuizData(response);
        setAnswers(
          response.questions.map((q) => ({
            questionId: q.question_id,
            userAnswer: "",
          }))
        );
      } catch (error) {
        console.error("🚨 퀴즈 데이터 로딩 실패:", error);
        setError("퀴즈 데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prevAnswers) => {
      const updatedAnswers = [...prevAnswers];
      const index = updatedAnswers.findIndex((a) => a.questionId === questionId);

      if (index !== -1) {
        updatedAnswers[index].userAnswer = value;
      } else {
        updatedAnswers.push({ questionId, userAnswer: value });
      }
      return updatedAnswers;
    });
  };

  const handleSubmitQuiz = async () => {
    try {
      if (!quizData || !quizData.questions) {
        throw new Error("퀴즈 데이터가 없습니다.");
      }

      if (!userId) {
        alert("로그인이 필요합니다.");
        return;
      }

      const missingAnswers = quizData.questions.filter(
        (q) =>
          !answers.some((a) => a.questionId === q.question_id && a.userAnswer !== "")
      );

      if (missingAnswers.length > 0) {
        alert("모든 문제에 답변해야 합니다.");
        return;
      }

      setSubmitting(true);
      const result = await submitQuiz(quizId, userId, mode, answers);
      console.log("✅ 퀴즈 제출 결과:", result);

      navigate(`/quiz-result/${quizId}`);
    } catch (error) {
      console.error("🚨 퀴즈 제출 오류:", error);
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
        {/* 페이지 타이틀: ContentTitle 규격 */}
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-5">
          {quizData.title}
        </h2>

        <div className="space-y-6">
          {quizData.questions.map((question, index) => (
            <div
              key={question.question_id}
              className="border border-gray-200 shadow-sm rounded-xl p-6"
            >
              {/* 섹션 제목: text-base font-semibold */}
              <p className="text-base font-semibold text-gray-900 mb-2">
                문제 {index + 1}
              </p>

              {/* 문제 본문: text-sm leading-relaxed */}
              <p className="text-sm text-gray-800 leading-relaxed mb-4">
                {question.question_text}
              </p>

              {/* OX 문제 */}
              {question.question_type === 1 && (
                <div className="flex gap-4">
                  {["O", "X"].map((value) => (
                    <label
                      key={value}
                      className={`flex items-center gap-2 px-4 py-2 border rounded-full cursor-pointer text-sm
                      ${
                        answers.find((a) => a.questionId === question.question_id)?.userAnswer ===
                        (value === "O" ? "true" : "false")
                          ? "bg-[#A7DA9B] text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <input
                        type="radio"
                        className="hidden"
                        name={`q-${question.question_id}`}
                        value={value}
                        checked={
                          answers.find((a) => a.questionId === question.question_id)?.userAnswer ===
                          (value === "O" ? "true" : "false")
                        }
                        onChange={() =>
                          handleAnswerChange(question.question_id, value === "O" ? "true" : "false")
                        }
                      />
                      {value}
                    </label>
                  ))}
                </div>
              )}


              {/* 객관식 문제 */}
              {question.question_type === 2 && (
                <div className="space-y-2">
                  {question.choices.map((choice, idx) => (
                    <label
                      key={idx}
                      className={`block px-4 py-2 border rounded-lg cursor-pointer text-sm
                      ${
                        answers.find((a) => a.questionId === question.question_id)?.userAnswer ===
                        choice
                          ? "bg-[#A7DA9B] text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <input
                        type="radio"
                        className="hidden"
                        name={`q-${question.question_id}`}
                        value={choice}
                        checked={
                          answers.find((a) => a.questionId === question.question_id)?.userAnswer ===
                          choice
                        }
                        onChange={() => handleAnswerChange(question.question_id, choice)}
                      />
                      {choice}
                    </label>
                  ))}
                </div>
              )}

              {/* 단답형 문제 */}
              {question.question_type === 3 && (
                <input
                  type="text"
                  placeholder="정답을 입력하세요"
                  className="w-full mt-2 border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A7DA9B]"
                  value={
                    answers.find((a) => a.questionId === question.question_id)?.userAnswer || ""
                  }
                  onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <button
            className="px-5 py-2 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 shadow inline-flex items-center gap-2"
            onClick={handleSubmitQuiz}
            disabled={submitting}
          >
            {submitting ? "제출 중..." : "퀴즈 제출하기"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizSolvePage;
