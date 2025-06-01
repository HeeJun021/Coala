import React, { useState, useEffect } from "react";
import { createQuestion } from "../../api/adminApi";

const CreateQuestionDialog = ({ open, onClose, onCreate }) => {
  const [question, setQuestion] = useState({
    question_text: "",
    question_type: 1,
    difficulty: 1,
    correct_answer: "",
    explanation: "",
    choices: [],
  });

  useEffect(() => {
    if (open) {
      // 다이얼로그가 열릴 때 초기화
      setQuestion({
        question_text: "",
        question_type: 1,
        difficulty: 1,
        correct_answer: "",
        explanation: "",
        choices: [],
      });
    }
  }, [open]);

  const handleChange = (key, value) => {
    setQuestion((prev) => {
      const updated = { ...prev, [key]: value };

      // 문제 유형 변경 시 choices 및 correct_answer 초기화
      if (key === "question_type") {
        if (value === 2) {
          updated.choices = ["", "", "", ""];
          updated.correct_answer = [];
        } else {
          updated.choices = [];
          updated.correct_answer = "";
        }
      }

      return updated;
    });
  };

  const handleChoiceChange = (index, value) => {
    const updatedChoices = [...question.choices];
    updatedChoices[index] = value;
    setQuestion((prev) => ({
      ...prev,
      choices: updatedChoices,
    }));
  };

  const handleCheckboxChange = (choice) => {
    const updated = [...question.correct_answer];
    const index = updated.indexOf(choice);
    if (index > -1) {
      updated.splice(index, 1);
    } else {
      updated.push(choice);
    }
    setQuestion((prev) => ({
      ...prev,
      correct_answer: updated,
    }));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        question_text: question.question_text,
        question_type: question.question_type,
        difficulty: question.difficulty,
        explanation: question.explanation,
        correct_answer:
          question.question_type === 2
            ? question.correct_answer.join(",")
            : question.correct_answer,
        choices: question.question_type === 2 ? question.choices : null,
      };

      const response = await createQuestion(payload);
      onCreate(response);
      onClose();
    } catch (error) {
      console.error("문제 생성 실패:", error);
      alert("문제 생성에 실패했습니다.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6">
        <h2 className="text-xl font-bold mb-4">📝 새 문제 만들기</h2>

        {/* 문제 유형 선택 */}
        <div className="flex gap-2 mb-4">
          {[{ type: 1, label: "O/X" }, { type: 2, label: "객관식" }, { type: 3, label: "단답형" }].map((opt) => (
            <button
              key={opt.type}
              onClick={() => handleChange("question_type", opt.type)}
              className={`px-3 py-1 rounded ${
                question.question_type === opt.type
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 문제 내용 */}
        <input
          type="text"
          placeholder="문제 내용"
          value={question.question_text}
          onChange={(e) => handleChange("question_text", e.target.value)}
          className="w-full border p-2 mb-3"
        />

        {/* 정답 입력 */}
        {question.question_type === 1 && (
          <div className="flex gap-4 mb-3">
            {["O", "X"].map((opt) => (
              <label key={opt} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="ox"
                  checked={question.correct_answer === opt}
                  onChange={() => handleChange("correct_answer", opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        )}

        {question.question_type === 2 && (
          <div className="space-y-2 mb-3">
            {question.choices.map((choice, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  disabled={!choice.trim()}
                  checked={question.correct_answer.includes(choice)}
                  onChange={() => handleCheckboxChange(choice)}
                />
                <input
                  type="text"
                  placeholder={`선택지 ${idx + 1}`}
                  value={choice}
                  onChange={(e) => handleChoiceChange(idx, e.target.value)}
                  className="w-full border p-1"
                />
              </div>
            ))}
          </div>
        )}

        {question.question_type === 3 && (
          <input
            type="text"
            placeholder="정답"
            value={question.correct_answer}
            onChange={(e) => handleChange("correct_answer", e.target.value)}
            className="w-full border p-2 mb-3"
          />
        )}

        {/* 난이도 선택 */}
        <select
          value={question.difficulty}
          onChange={(e) => handleChange("difficulty", parseInt(e.target.value))}
          className="w-full border p-2 mb-3"
        >
          <option value={1}>쉬움</option>
          <option value={2}>보통</option>
          <option value={3}>어려움</option>
        </select>

        {/* 해설 */}
        <textarea
          placeholder="해설 입력"
          value={question.explanation}
          onChange={(e) => handleChange("explanation", e.target.value)}
          className="w-full border p-2 mb-4 resize-none"
        />

        {/* 버튼 영역 */}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            생성
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateQuestionDialog;
