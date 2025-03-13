import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getQuizDetails } from "../api/quizApi";

const QuizSolvePage = () => {
    const { quizId } = useParams(); // URL에서 quizId 가져오기
    const [quizData, setQuizData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ✅ 퀴즈 데이터 가져오기
    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                if (!quizId) {
                    throw new Error("퀴즈 ID가 없습니다.");
                }
                console.log(quizId)
                const response = await getQuizDetails(quizId); // ✅ API 요청
                console.log("✅ 퀴즈 데이터 가져오기 성공:", response);

                if (!response || !response.questions || response.questions.length === 0) {
                    throw new Error("퀴즈 데이터에 질문이 없습니다.");
                }

                setQuizData(response);
            } catch (error) {
                console.error("🚨 퀴즈 데이터 로딩 실패:", error);
                setError("퀴즈 데이터를 불러오는 중 오류가 발생했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchQuiz();
    }, [quizId]);

    if (loading) return <p className="text-center text-lg">로딩 중...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">{quizData?.title}</h2>

            {quizData.questions?.length > 0 ? (
                quizData.questions.map((question, index) => (
                    <div key={question.question_id} className="mb-6 p-4 border rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold">{`문제 ${index + 1}: ${question.question_text}`}</h3>

                        {/* ✅ 문제 유형별 보기 방식 */}
                        {question.question_type === 1 ? (
                            <p className="mt-2 text-gray-700">이 문제는 O/X 문제입니다.</p>
                        ) : question.question_type === 2 ? (
                            <ul className="mt-2">
                                {question.choices && question.choices.map((choice, idx) => (
                                    <li key={idx} className="border p-2 rounded-md bg-gray-100">
                                        {choice}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-2 text-gray-700">이 문제는 단답형 문제입니다.</p>
                        )}
                    </div>
                ))
            ) : (
                <p className="text-center text-gray-500">문제가 없습니다.</p>
            )}
        </div>
    );
};

export default QuizSolvePage;
