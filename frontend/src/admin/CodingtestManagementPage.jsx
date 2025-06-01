import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getCodingTestList } from "../api/codingTestApi";
import { deleteAdminCodingTest } from "../api/adminCodingtestApi";
import { FaEllipsisV, FaSortUp, FaSortDown } from "react-icons/fa";

const CodingtestManagementPage = () => {
  const [tests, setTests] = useState([]);
  const [dropdownOpenId, setDropdownOpenId] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortOrder, setSortOrder] = useState("desc");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const pageSize = 20;
  const navigate = useNavigate();

  const fetchTests = useCallback(async () => {
    try {
      const res = await getCodingTestList({ page, sort: sortOrder, level: difficultyFilter });
      setTests(res.problems);
      setTotal(res.total);
    } catch (err) {
      console.error("문제 목록 조회 실패:", err);
    }
  }, [page, sortOrder, difficultyFilter]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleDelete = async (test_id) => {
    const confirmed = window.confirm("정말로 이 문제를 삭제하시겠습니까?");
    if (!confirmed) return;
    try {
      await deleteAdminCodingTest(test_id);
      alert("삭제되었습니다.");
      fetchTests();
    } catch (err) {
      console.error("삭제 실패:", err);
      alert("삭제 중 오류 발생");
    }
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">코딩 테스트 문제 관리</h1>

      {/* 필터 */}
      <div className="flex justify-between items-center gap-4 mb-4">
        <div />
        <select
          value={difficultyFilter}
          onChange={(e) => {
            setPage(1);
            setDifficultyFilter(e.target.value);
          }}
          className="px-3 py-1 border rounded"
        >
          <option value="">전체 난이도</option>
          <option value="1">Lv.1</option>
          <option value="2">Lv.2</option>
          <option value="3">Lv.3</option>
          <option value="4">Lv.4</option>
          <option value="5">Lv.5</option>
        </select>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full table-auto text-left">
          <thead className="bg-navbar text-white">
            <tr>
              <th className="px-4 py-3">제목</th>
              <th className="px-4 py-3">난이도</th>
              <th className="px-4 py-3">카테고리</th>
              <th className="px-4 py-3 cursor-pointer" onClick={toggleSortOrder}>
                <div className="flex items-center gap-1">
                  정답률
                  {sortOrder === "desc" ? <FaSortDown size={14} /> : <FaSortUp size={14} />}
                </div>
              </th>
              <th className="px-4 py-3 text-center">관리</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((test) => (
              <tr
                key={test.id}
                className="border-t cursor-pointer hover:bg-gray-50 transition"
                onClick={() => navigate(`/admin/codingtest/${test.id}`)}
              >
                <td className="px-4 py-3">{test.title}</td>
                <td className="px-4 py-3">Lv.{test.level}</td>
                <td className="px-4 py-3">{test.category || "-"}</td>
                <td className="px-4 py-3">{test.correct_rate?.toFixed(2)}%</td>
                <td className="px-4 py-3 text-center relative">
                  <button
                    className="text-gray-600 hover:text-black"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpenId(dropdownOpenId === test.id ? null : test.id);
                    }}
                  >
                    <FaEllipsisV />
                  </button>
                  {dropdownOpenId === test.id && (
                    <div
                      className="absolute right-0 mt-2 bg-white border rounded shadow-md z-10 w-32"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-red-100 text-red-600"
                        onClick={() => handleDelete(test.id)}
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center items-center gap-1 mt-8">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            onClick={() => setPage(num)}
            className={`px-3 py-1 rounded-md text-sm font-medium border transition-all duration-150 ${
              page === num
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CodingtestManagementPage;
