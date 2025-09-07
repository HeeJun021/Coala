import React from "react";
import IncorrectQuestionItem from "./IncorrectQuestionItem";

/**
 * @param {{questions: Array<Object>}} props
 */
export default function IncorrectQuestionList({ questions }) {
  return (
    <div className="bg-white border border-gray-300 rounded-2xl shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800">오답 문제 목록</h2>
      <p className="text-sm text-gray-500 mt-1 mb-4">
        선택한 언어의 오답 문제를 확인하고, 해설을 통해 복습하세요.
      </p>

      {questions?.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {questions.map((question) => (
            <IncorrectQuestionItem key={question.question_id} question={question} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-600">선택된 언어에 해당하는 오답 문제가 없습니다.</p>
      )}
    </div>
  );
}
