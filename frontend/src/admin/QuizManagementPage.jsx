import React, { useEffect, useState } from "react";
import { fetchQuestions } from "../api/quizApi";
import { deleteQuestion } from "../api/adminApi";
import CreateQuestionDialog from "../admin/component/CreateQuestionDialog";

const QuizManagementPage = () => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);

  const loadQuestions = async () => {
    try {
      const data = await fetchQuestions({});
      setQuestions(data);
    } catch (err) {
      console.error("퀴즈 데이터를 불러오지 못했습니다:", err);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    const filtered = questions.filter((q) => {
      const matchType = typeFilter === "all" || String(q.question_type) === typeFilter;
      const matchDiff = difficultyFilter === "all" || String(q.difficulty) === difficultyFilter;
      return matchType && matchDiff;
    });

    setFilteredQuestions(filtered);
  }, [typeFilter, difficultyFilter, questions]);

  const handleDelete = async (id) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      try {
        await deleteQuestion(id);
        await loadQuestions();
      } catch (err) {
        console.error("문제 삭제 중 오류 발생:", err);
        alert("문제 삭제에 실패했습니다.");
      }
    }
  };

  const handleCreate = async () => {
    await loadQuestions();
    setOpenDialog(false);
  };

  const mapType = (type) => (type === 1 ? "OX" : type === 2 ? "단답형" : "객관식");
  const mapDifficulty = (d) => (d === 1 ? "쉬움" : d === 2 ? "보통" : "어려움");

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">퀴즈 문제 관리</h1>

      {/* 필터 + 추가버튼 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            <option value="all">전체 유형</option>
            <option value="1">OX</option>
            <option value="2">객관식</option>
            <option value="3">단답형</option>
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            <option value="all">전체 난이도</option>
            <option value="1">쉬움</option>
            <option value="2">보통</option>
            <option value="3">어려움</option>
          </select>
        </div>

        <button
          onClick={() => setOpenDialog(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          + 문제 추가하기
        </button>
      </div>

      {/* 테이블 영역 */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full table-auto text-left">
          <thead className="bg-navbar text-white">
            <tr>
              <th className="px-4 py-3">문제</th>
              <th className="px-4 py-3">유형</th>
              <th className="px-4 py-3">난이도</th>
              <th className="px-4 py-3 text-center">관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuestions.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-6 text-center text-gray-500">
                  문제가 없습니다.
                </td>
              </tr>
            ) : (
              filteredQuestions.map((q) => (
                <tr
                  key={q.question_id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="px-4 py-3">{q.question_text}</td>
                  <td className="px-4 py-3">{mapType(q.question_type)}</td>
                  <td className="px-4 py-3">{mapDifficulty(q.difficulty)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(q.question_id)}
                      className="text-sm text-red-500 hover:underline"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 생성 다이얼로그 */}
      <CreateQuestionDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onCreate={handleCreate}
      />
    </div>
  );
};

export default QuizManagementPage;
