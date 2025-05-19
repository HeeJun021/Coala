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

  // ✅ 문제 전체 불러오기 함수
  const loadQuestions = async () => {
    try {
      const data = await fetchQuestions({});
      setQuestions(data);
    } catch (err) {
      console.error("퀴즈 데이터를 불러오지 못했습니다:", err);
    }
  };

  // ✅ 첫 로딩 시 전체 문제 불러오기
  useEffect(() => {
    loadQuestions();
  }, []);

  // ✅ 필터링된 문제 리스트 계산
  useEffect(() => {
    const filtered = questions.filter((q) => {
      const matchType = typeFilter === "all" || String(q.question_type) === typeFilter;
      const matchDiff = difficultyFilter === "all" || String(q.difficulty) === difficultyFilter;
      return matchType && matchDiff;
    });

    setFilteredQuestions(filtered);
  }, [typeFilter, difficultyFilter, questions]);

  // ✅ 문제 삭제 처리
  const handleDelete = async (id) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      try {
        await deleteQuestion(id);
        await loadQuestions(); // 삭제 후 목록 갱신
      } catch (err) {
        console.error("문제 삭제 중 오류 발생:", err);
        alert("문제 삭제에 실패했습니다.");
      }
    }
  };

  // ✅ 문제 생성 완료 시 목록 갱신 + 다이얼로그 닫기
  const handleCreate = async () => {
    await loadQuestions();
    setOpenDialog(false);
  };

  // ✅ 텍스트 변환
  const mapType = (type) => (type === 1 ? "OX" : type === 2 ? "객관식" : "단답형");
  const mapDifficulty = (d) => (d === 1 ? "쉬움" : d === 2 ? "보통" : "어려움");

  return (
    <div className="px-4 md:px-8 py-6 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">🧩 퀴즈 관리</h1>

      {/* 필터 영역 */}
      <div className="flex gap-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1"
        >
          <option value="all">전체 유형</option>
          <option value="1">OX</option>
          <option value="2">객관식</option>
          <option value="3">단답형</option>
        </select>

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1"
        >
          <option value="all">전체 난이도</option>
          <option value="1">쉬움</option>
          <option value="2">보통</option>
          <option value="3">어려움</option>
        </select>
      </div>

      {/* 문제 카드 목록 */}
      <ul className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <p className="text-gray-500">문제가 없습니다.</p>
        ) : (
          filteredQuestions.map((q) => (
            <li
              key={q.question_id}
              className="p-4 bg-white rounded shadow-sm flex justify-between items-start"
            >
              <div>
                <p className="font-medium">{q.question_text}</p>
                <p className="text-sm text-gray-500 mt-1">
                  유형: {mapType(q.question_type)} | 난이도: {mapDifficulty(q.difficulty)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(q.question_id)}
                className="text-sm text-red-500 hover:underline"
              >
                삭제
              </button>
            </li>
          ))
        )}
      </ul>

      {/* 문제 추가 버튼 */}
      <div className="mt-6">
        <button
          onClick={() => setOpenDialog(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          + 문제 추가하기
        </button>
      </div>

      {/* 문제 생성 다이얼로그 */}
      <CreateQuestionDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onCreate={handleCreate}
      />
    </div>
  );
};

export default QuizManagementPage;
