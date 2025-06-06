import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createQuiz } from "../api/quizApi";
import QuizSideBar from "../Layout/QuizSideBar";

const TestQuiz = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // ✅ 문제 유형은 항상 OX, 단답형, 선택형 포함
    const selectedTypes = {
        ox: true,
        short: true,
        multiple: true
    };

    // "퀴즈 풀기" 버튼 클릭 시 API 호출
    const handleStartQuiz = async () => {
        setLoading(true);
        try {
            const quizPayload = {
                title: "사용자 테스트 퀴즈",
                quiz_type: "test", // 테스트 퀴즈
                time_limit: 30, // 30분 제한
                settings: Object.keys(selectedTypes).map((type) => ({
                    question_type: type === "ox" ? 1 : type === "short" ? 2 : 3,
                    difficulty: 3, // 난이도 Lv.3 고정
                    question_count: 3 // 문제 개수 5개 고정
                }))
            };

            console.log("퀴즈 생성 요청:", quizPayload);
            const newQuiz = await createQuiz(quizPayload);
            console.log("퀴즈 생성 완료:", newQuiz);

            if (newQuiz && newQuiz.quiz_id) {
              navigate(`/quizsolve/${newQuiz.quiz_id}?mode=test`);
            } else {
                alert("퀴즈 생성은 되었지만 ID를 찾을 수 없습니다.");
            }
        } catch (error) {
            console.error("퀴즈 생성 실패:", error);
            alert("퀴즈 생성 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex w-full">
            <QuizSideBar />
            <div className="flex-1 max-w-5xl pt-12 mx-auto">
                <h2 className="text-2xl font-bold mb-6">테스트 퀴즈 설정</h2>

                {/* ✅ 문제 유형 (항상 OX, 단답형, 선택형 포함) */}
                <div className="flex items-center gap-7 mb-6">
                    <span className="text-lg font-semibold">문제 유형</span>
                    {["ox", "short", "multiple"].map((type) => (
                        <label key={type} className="flex items-center space-x-2 cursor-default">
                        {/* 선택 불가능하므로 input은 렌더링 X */}
                        <div
                            className="px-4 py-2 rounded-lg border-2 bg-accent text-white border-navbar transition-all"
                        >
                            {type === "ox" ? "O/X" : type === "short" ? "단답형" : "선택형"}
                        </div>
                        </label>
                    ))}
                </div>

                {/* ✅ 문제 개수 & 난이도 (수정 불가능) */}
                <div className="grid grid-cols-3 gap-6 w-full">
                    {["ox", "short", "multiple"].map((type) => (
                        <div key={type} className="p-4 rounded-lg border-2 transition-all border-navbar-500">
                            <h3 className="text-md font-semibold mb-3">
                                {type === "ox" ? "O/X" : type === "short" ? "단답형" : "선택형"}
                            </h3>

                            {/* ✅ 문제 개수 (5개 고정, 수정 불가능) */}
                            <label className="block mb-2">
                                <span className="text-sm">문제 개수</span>
                                <select className="w-full p-2 mt-1 border rounded-lg bg-gray-200" disabled>
                                    <option value="5">3개</option>
                                </select>
                            </label>

                            {/* ✅ 난이도 (Lv.3 고정, 수정 불가능) */}
                            <label className="block">
                                <span className="text-sm">난이도</span>
                                <select className="w-full p-2 mt-1 border rounded-lg bg-gray-200" disabled>
                                    <option value="Lv.3">Lv.3</option>
                                </select>
                            </label>
                        </div>
                    ))}
                </div>

                {/* ✅ 퀴즈 풀기 버튼 */}
                <div className="flex pt-4 justify-end">
                    <button
                        className="px-6 py-2 bg-accent text-white font-semibold rounded-lg shadow-lg hover:bg-green-600 transition-all"
                        onClick={handleStartQuiz}
                        disabled={loading}
                    >
                        {loading ? "생성 중..." : "퀴즈 풀기"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TestQuiz;
