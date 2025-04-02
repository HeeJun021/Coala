import React, { useState } from "react";
import { createUserQuiz } from "../api/userQuizApi";

const CreateUserQuiz = ({ userData }) => {
  const [quizTitle, setQuizTitle] = useState("");
  const [content, setContent] = useState("");
  const [questions, setQuestions] = useState([]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: "",
        choices: [],
        correct_answer: [], // ✅ 배열로 변경
        explanation: "",
        categories: ""
      },
    ]);
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    if (field === "question_type") {
      updated[index].choices = value === 2 ? ["", "", "", ""] : [];
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
      updated[qIdx].correct_answer = updated[qIdx].correct_answer.filter((c) => c !== choice);
    } else {
      updated[qIdx].correct_answer.push(choice);
    }
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    try {
      const formattedQuestions = questions.map((q) => ({
        question_text: q.question_text,
        choices: q.choices.length > 0 ? q.choices : null,
        correct_answer:
          q.question_type === 2
            ? q.correct_answer.join(",") // ✅ 객관식일 때만 join
            : q.correct_answer,
        explanation: q.explanation,
        categories: q.categories,
      }));
  
      const data = {
        user_id: userData.user_id,
        title: quizTitle,
        content,
        questions: formattedQuestions,
      };
  
      const response = await createUserQuiz(data);
      alert("퀴즈 생성 성공! ID: " + response.userquiz_id);
    } catch (error) {
      console.error(error);
      alert("퀴즈 생성 실패");
    }
  };
  

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl mb-4 font-semibold text-center">사용자 퀴즈 만들기</h2>
      <input
        type="text"
        placeholder="퀴즈 제목"
        value={quizTitle}
        onChange={(e) => setQuizTitle(e.target.value)}
        className="border p-2 mb-2 w-full"
      />
      <textarea
        placeholder="퀴즈 설명"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="border p-2 mb-4 w-full"
      />

      {questions.map((q, idx) => (
        <div key={idx} className="mb-6 border border-gray-300 rounded p-4 bg-white shadow-sm">
          <div className="flex items-center mb-3">
            <span className="mr-3 font-semibold">문제 {idx + 1}</span>
            <div className="flex gap-2">
              {[{ type: 1, label: "O/X" }, { type: 2, label: "객관식" }, { type: 3, label: "단답형" }].map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleQuestionChange(idx, "question_type", item.type)}
                  className={`px-3 py-1 rounded ${
                    q.question_type === item.type
                      ? "bg-navbar text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            placeholder="문제 내용"
            value={q.question_text}
            onChange={(e) => handleQuestionChange(idx, "question_text", e.target.value)}
            className="border p-2 mb-2 w-full bg-gray-50"
          />

          {q.question_type === 1 && (
            <div className="flex gap-4 mb-2">
              {["O", "X"].map((opt) => (
                <label key={opt} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`ox-${idx}`}
                    checked={q.correct_answer === opt}
                    onChange={() => handleQuestionChange(idx, "correct_answer", opt)}
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
                    onChange={(e) => handleChoiceChange(idx, cIdx, e.target.value)}
                    className="border p-1 w-full bg-gray-50"
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
              onChange={(e) => handleQuestionChange(idx, "correct_answer", e.target.value)}
              className="border p-2 mb-2 w-full bg-gray-50"
            />
          )}

          <textarea
            placeholder="해설"
            value={q.explanation}
            onChange={(e) => handleQuestionChange(idx, "explanation", e.target.value)}
            className="border p-2 w-full bg-gray-50"
          />
        </div>
      ))}

      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={handleAddQuestion}
          className="bg-accent text-white px-4 py-2 rounded"
        >
          문제 추가
        </button>
        <button
          onClick={handleSubmit}
          className="bg-navbar text-white px-4 py-2 rounded"
        >
          퀴즈 생성하기
        </button>
      </div>
    </div>
  );
};

export default CreateUserQuiz;
