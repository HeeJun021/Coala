import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getQuizDetails, submitQuiz } from "../api/quizApi";

const QuizSolvePage = ({ userData }) => { // ✅ userData 받기
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

    // ✅ userData에서 userId 가져오기
    const userId = userData?.user_id;

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                if (!quizId) {
                    throw new Error("퀴즈 ID가 없습니다.");
                }

                const response = await getQuizDetails(quizId);
                console.log("✅ 퀴즈 데이터 가져오기 성공:", response);

                if (!response || !response.questions || response.questions.length === 0) {
                    throw new Error("퀴즈 데이터에 질문이 없습니다.");
                }

                setQuizData(response);
                setAnswers(response.questions.map(q => ({
                    questionId: q.question_id,
                    userAnswer: ""
                })));

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
        setAnswers(prevAnswers => {
            const updatedAnswers = [...prevAnswers];
            const existingIndex = updatedAnswers.findIndex(a => a.questionId === questionId);

            if (existingIndex !== -1) {
                updatedAnswers[existingIndex].userAnswer = value;
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
    
            const missingAnswers = quizData.questions.filter(q =>
                !answers.some(a => a.questionId === q.question_id && a.userAnswer !== "")
            );
    
            if (missingAnswers.length > 0) {
                alert("모든 문제에 답변해야 합니다.");
                return;
            }
    
            setSubmitting(true);
            const result = await submitQuiz(quizId, userId, mode, answers);
            console.log("✅ 퀴즈 제출 결과:", result);
    
            // ✅ 퀴즈 결과 페이지로 이동 (quizId 포함)
            navigate(`/quiz-result/${quizId}`);
    
        } catch (error) {
            console.error("🚨 퀴즈 제출 오류:", error);
            alert("퀴즈 제출 중 오류가 발생했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <p>로딩 중...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">{quizData.title}</h2>

            {quizData.questions.map((question, index) => (
                <div key={question.question_id} className="mb-6 p-4 border rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold">{`문제 ${index + 1}: ${question.question_text}`}</h3>

                    {question.question_type === 1 ? (
                        <div className="mt-2">
                            <label className="mr-4">
                                <input
                                    type="radio"
                                    name={`q-${question.question_id}`}
                                    value="O"
                                    checked={answers.find(a => a.questionId === question.question_id)?.userAnswer === "O"}
                                    onChange={() => handleAnswerChange(question.question_id, "O")}
                                /> O
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name={`q-${question.question_id}`}
                                    value="X"
                                    checked={answers.find(a => a.questionId === question.question_id)?.userAnswer === "X"}
                                    onChange={() => handleAnswerChange(question.question_id, "X")}
                                /> X
                            </label>
                        </div>
                    ) : question.question_type === 2 ? (
                        <div className="mt-2">
                            {question.choices.map((choice, idx) => (
                                <label key={idx} className="block">
                                    <input
                                        type="radio"
                                        name={`q-${question.question_id}`}
                                        value={choice}
                                        checked={answers.find(a => a.questionId === question.question_id)?.userAnswer === choice}
                                        onChange={() => handleAnswerChange(question.question_id, choice)}
                                    /> {choice}
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-2">
                            <input
                                type="text"
                                className="border p-2 w-full"
                                placeholder="정답을 입력하세요"
                                value={answers.find(a => a.questionId === question.question_id)?.userAnswer || ""}
                                onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                            />
                        </div>
                    )}
                </div>
            ))}
            <div className="flex justify-center mt-4">
                <button
                    className="px-6 py-2 bg-navbar text-white font-semibold rounded-lg mt-4"
                    onClick={handleSubmitQuiz}
                    disabled={submitting}
                >
                    {submitting ? "제출 중..." : "퀴즈 제출하기"}
                </button>
            </div>
        </div>
    );
};

export default QuizSolvePage;
