import React, { useState } from "react";
import { createUserQuiz } from "../api/userQuizApi";
import { useNavigate } from "react-router-dom"; // 🔥 추가

const UserQuiz = ({ userData }) => {
  const [quizTitle, setQuizTitle] = useState("");
  const [content, setContent] = useState("");
  const [questions, setQuestions] = useState([]);
  const navigate = useNavigate(); // 🔥 추가

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: "",
        choices: [],
        correct_answer: "",
        explanation: "",
        categories: "",
      },
    ]);
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    try {
      const data = {
        user_id: userData.user_id,
        title: quizTitle,
        content,
        questions,
      };
      const response = await createUserQuiz(data);
      alert("퀴즈 생성 성공! ID: " + response.userquiz_id);
    } catch (error) {
      console.error(error);
      alert("퀴즈 생성 실패");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">내 사용자 퀴즈</h2>

      {/* 🔥 퀴즈 만들기 버튼 추가 */}
      <button
        onClick={() => navigate("/user-quiz/create")}
        className="bg-green-500 text-white px-4 py-2 rounded mb-4"
      >
        퀴즈 만들기
      </button>

      {/* 이후에는 내 퀴즈 목록 조회 API 연결할 예정 */}

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
        <div key={idx} className="mb-4 border p-3 rounded">
          <h4 className="mb-2">문제 {idx + 1}</h4>
          <input
            type="text"
            placeholder="문제 내용"
            value={q.question_text}
            onChange={(e) => handleQuestionChange(idx, "question_text", e.target.value)}
            className="border p-2 mb-2 w-full"
          />
          <input
            type="text"
            placeholder="정답"
            value={q.correct_answer}
            onChange={(e) => handleQuestionChange(idx, "correct_answer", e.target.value)}
            className="border p-2 mb-2 w-full"
          />
          <input
            type="text"
            placeholder="카테고리"
            value={q.categories}
            onChange={(e) => handleQuestionChange(idx, "categories", e.target.value)}
            className="border p-2 mb-2 w-full"
          />
          <textarea
            placeholder="해설"
            value={q.explanation}
            onChange={(e) => handleQuestionChange(idx, "explanation", e.target.value)}
            className="border p-2 mb-2 w-full"
          />
        </div>
      ))}
      <button
        onClick={handleAddQuestion}
        className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
      >
        문제 추가
      </button>
      <button
        onClick={handleSubmit}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        퀴즈 생성하기
      </button>
    </div>
  );
};

export default UserQuiz;
