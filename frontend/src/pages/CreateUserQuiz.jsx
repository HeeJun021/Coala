import React, { useState } from "react";
import { createUserQuiz } from "../api/userQuizApi";
import UserQuizDialog from "../components/UserQuizDialog";
import { Plus, Trash2 } from "lucide-react";

const CreateUserQuiz = ({ userData }) => {
  const [quizTitle, setQuizTitle] = useState("");
  const [content, setContent] = useState("");
  const [questions, setQuestions] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [createdQuizId, setCreatedQuizId] = useState(null);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: "",
        choices: ["", "", "", ""],
        correct_answer: [],
        explanation: "",
        categories: "",
        question_type: 1,
      },
    ]);
  };

  const handleDeleteQuestion = (index) => {
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    if (field === "question_type") {
      updated[index].choices = value === 2 ? ["", "", "", ""] : null;
      updated[index].correct_answer = value === 2 ? [] : "";
    }
    setQuestions(updated);
  };

  const handleChoiceChange = (qIdx, cIdx, value) => {
    const updated = [...questions];
    updated[qIdx].choices[cIdx] = value;
    setQuestions(updated);
  };

  const handleCheckboxChange = (qIdx, choice) => {
    if (!choice.trim()) return;
    const updated = [...questions];
    const isChecked = updated[qIdx].correct_answer.includes(choice);
    if (isChecked) {
      updated[qIdx].correct_answer = updated[qIdx].correct_answer.filter(
        (c) => c !== choice
      );
    } else {
      updated[qIdx].correct_answer.push(choice);
    }
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    try {
      const formattedQuestions = questions.map((q) => ({
        question_text: q.question_text,
        choices: q.question_type === 2 ? q.choices : null,
        correct_answer:
          q.question_type === 2 ? q.correct_answer.join(",") : q.correct_answer,
        explanation: q.explanation,
        categories: q.categories,
        question_type: q.question_type,
      }));

      const data = {
        user_id: userData.user_id,
        title: quizTitle,
        content,
        questions: formattedQuestions,
      };

      const response = await createUserQuiz(data);
      setCreatedQuizId(response.userquiz_id);
      setShowDialog(true);
    } catch (error) {
      console.error(error);
      alert("퀴즈 생성 실패");
    }
  };

  return (
    <div className="relative max-w-4xl mt-10 mx-auto p-6">
      {/* 퀴즈 생성하기 버튼 (상단 우측) */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">사용자 퀴즈 만들기</h2>
        <button
          onClick={handleSubmit}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded shadow"
        >
          퀴즈 생성하기
        </button>
      </div>

      {/* 제목 & 설명 */}
      <div className="border border-gray-300 rounded-md p-4 mb-6 bg-gray-50">
        <input
          type="text"
          placeholder="퀴즈 제목"
          value={quizTitle}
          onChange={(e) => setQuizTitle(e.target.value)}
          className="border p-2 mb-4 w-full rounded"
        />
        <textarea
          placeholder="퀴즈 설명"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border p-2 w-full h-24 resize-none rounded"
        />
      </div>

      {/* 문제 목록 */}
      {questions.map((q, idx) => (
        <div
          key={idx}
          className="mb-6 border border-gray-300 rounded p-4 bg-white shadow-sm relative"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-lg">문제 {idx + 1}</span>
            <button
              onClick={() => handleDeleteQuestion(idx)}
              className="text-red-500 hover:text-red-700"
              title="문제 삭제"
            >
              <Trash2 size={20} />
            </button>
          </div>

          <div className="flex gap-2 mb-2">
            {[{ type: 1, label: "O/X" }, { type: 2, label: "객관식" }, { type: 3, label: "단답형" }].map((item) => (
              <button
                key={item.type}
                onClick={() => handleQuestionChange(idx, "question_type", item.type)}
                className={`px-3 py-1 rounded ${
                  q.question_type === item.type
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="문제 내용"
            value={q.question_text}
            onChange={(e) =>
              handleQuestionChange(idx, "question_text", e.target.value)
            }
            className="border p-2 mb-2 w-full bg-gray-50 rounded"
          />

          {/* 문제 유형별 입력 */}
          {q.question_type === 1 && (
            <div className="flex gap-4 mb-2">
              {["O", "X"].map((opt) => (
                <label key={opt} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`ox-${idx}`}
                    checked={q.correct_answer === opt}
                    onChange={() =>
                      handleQuestionChange(idx, "correct_answer", opt)
                    }
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          )}

          {q.question_type === 2 && (
            <div className="space-y-2 mb-2">
              {q.choices.map((choice, cIdx) => (
                <div key={cIdx} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    disabled={!choice.trim()}
                    checked={q.correct_answer.includes(choice)}
                    onChange={() => handleCheckboxChange(idx, choice)}
                  />
                  <input
                    type="text"
                    placeholder={`선택지 ${cIdx + 1}`}
                    value={choice}
                    onChange={(e) =>
                      handleChoiceChange(idx, cIdx, e.target.value)
                    }
                    className="border p-1 w-full bg-gray-50 rounded"
                  />
                </div>
              ))}
            </div>
          )}

          {q.question_type === 3 && (
            <input
              type="text"
              placeholder="정답"
              value={q.correct_answer}
              onChange={(e) =>
                handleQuestionChange(idx, "correct_answer", e.target.value)
              }
              className="border p-2 mb-2 w-full bg-gray-50 rounded"
            />
          )}

          <textarea
            placeholder="해설"
            value={q.explanation}
            onChange={(e) =>
              handleQuestionChange(idx, "explanation", e.target.value)
            }
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            className="border p-2 w-full resize-none overflow-hidden rounded bg-gray-50"
          />
        </div>
      ))}

      <div className="flex justify-center mt-[-8px] ">
        <button
          onClick={handleAddQuestion}
          className="text-gray-500 hover:text-green-600 text-sm font-medium transition-colors"
        >
          문제 추가
        </button>
      </div>

      {/* 퀴즈 생성 완료 다이얼로그 */}
      {showDialog && (
        <UserQuizDialog
          onClose={() => setShowDialog(false)}
          createdQuizId={createdQuizId}
        />
      )}
    </div>
  );
};

export default CreateUserQuiz;
