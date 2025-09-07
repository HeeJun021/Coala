import React, { useState } from "react";

/**
 * @param {{question: {
 *  question_id: number,
 *  question_text: string,
 *  difficulty?: number|string,
 *  incorrect_attempts?: number,
 *  correct_answer?: string,
 *  explanation?: string
 * }}} props
 */
export default function IncorrectQuestionItem({ question }) {
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="rounded-xl p-4 hover:bg-gray-50 transition-colors">
        <p className="font-medium text-gray-900">{question.question_text}</p>

        <div className="mt-1 text-xs text-gray-500">
          난이도: <span className="text-gray-700">{question.difficulty}</span>
          <span className="mx-2">|</span>
          틀린 횟수: <span className="text-gray-700">{question.incorrect_attempts}회</span>
        </div>

        <button
          onClick={() => setShowExplanation((s) => !s)}
          className="mt-3 inline-flex items-center px-3 py-1.5 rounded-lg text-xs bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all"
        >
          {showExplanation ? "해설 숨기기" : "정답 및 해설 보기"}
        </button>

        {showExplanation && (
          <div className="mt-3 bg-gray-100 border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-800">
              <strong className="text-gray-900">정답:</strong> {question.correct_answer}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              <strong className="text-gray-900">해설:</strong> {question.explanation}
            </p>
          </div>
        )}
      </div>
    </li>
  );
}
