import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { fetchAdminTestSubmissions } from "../api/adminCodingtestApi";

const AdminCodingTestDetailPage = () => {
  const { testId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [filter, setFilter] = useState("all"); // all, correct, wrong

  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await fetchAdminTestSubmissions(testId);
      setSubmissions(res);
    } catch (err) {
      console.error("제출 목록 조회 실패:", err);
    }
  }, [testId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const filtered = submissions.filter((s) => {
    if (filter === "correct") return s.is_correct;
    if (filter === "wrong") return !s.is_correct;
    return true;
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">문제 제출 목록</h1>

      {/* 필터 탭 */}
      <div className="flex gap-4 mb-4">
        {["all", "correct", "wrong"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1 rounded ${filter === type ? "bg-green-600 text-white" : "bg-gray-200"}`}
          >
            {type === "all" ? "전체" : type === "correct" ? "맞은 풀이" : "틀린 풀이"}
          </button>
        ))}
      </div>

      {/* 제출 테이블 */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full table-auto text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">제목</th>
              <th className="px-4 py-2">제출자</th>
              <th className="px-4 py-2">제출일</th>
              <th className="px-4 py-2">언어</th>
              <th className="px-4 py-2">결과</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.submission_id} className="border-t">
                <td className="px-4 py-2">{s.title}</td>
                <td className="px-4 py-2">{s.nickname}</td>
                <td className="px-4 py-2">{new Date(s.submitted_at).toLocaleString()}</td>
                <td className="px-4 py-2">{s.language}</td>
                <td className={`px-4 py-2 font-bold ${s.is_correct ? "text-green-600" : "text-red-500"}`}>
                  {s.is_correct ? "정답" : "오답"}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center text-gray-500 py-6">
                  제출 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCodingTestDetailPage;
