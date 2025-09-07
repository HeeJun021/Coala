import React, { useState, useEffect } from "react";

/**
 * @param {{
 *  totalQuestions: number,
 *  languageId: number,
 *  onStartQuiz: (count: number, languageId: number) => void
 * }} props
 */
export default function RetakeQuizForm({ totalQuestions, languageId, onStartQuiz }) {
  const [count, setCount] = useState(10);

  useEffect(() => {
    if (count > totalQuestions && totalQuestions > 0) {
      setCount(totalQuestions);
    } else if (totalQuestions === 0) {
      setCount(0);
    }
  }, [totalQuestions, count]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (count > 0) onStartQuiz?.(count, languageId);
    else alert("1개 이상의 문제를 선택해야 합니다.");
  };

  if (totalQuestions === 0) {
    return (
      <p className="text-sm text-gray-600">
        복습할 오답 문제가 없습니다. <span className="font-medium">완벽해요! 👍</span>
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-7 bg-white border border-gray-300 rounded-2xl shadow-md p-5"
    >
      <p className="text-sm text-gray-700 mb-3">
        총 <strong className="text-gray-900">{totalQuestions}개</strong>의 오답 문제 중,
        원하는 개수를 선택해 복습 퀴즈를 시작하세요.
      </p>

      <div className="flex items-center gap-3">
        <input
          type="number"
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value, 10) || 0)}
          min="1"
          max={totalQuestions}
          className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-green-500"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm shadow-sm transition-all"
        >
          문제로 복습 퀴즈 시작하기
        </button>
      </div>
    </form>
  );
}
