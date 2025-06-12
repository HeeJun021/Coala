import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SubmissionListTable = ({ submissions = [] }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  if (!submissions || submissions.length === 0) {
    return <p className="text-sm text-gray-500 text-center mt-10">제출 기록이 없습니다.</p>;
  }

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = submissions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(submissions.length / itemsPerPage));

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-10 max-w-screen-lg mx-auto">
      <h2 className="text-lg font-semibold mb-4">코딩 테스트 제출 내역</h2>
      <table className="w-full border-collapse border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2 text-center">문제 ID</th>
            <th className="border px-4 py-2 text-center">제출 제목</th>
            <th className="border px-4 py-2 text-center">언어</th>
            <th className="border px-4 py-2 text-center">채점 결과</th>
            <th className="border px-4 py-2 text-center">테스트케이스</th>
            <th className="border px-4 py-2 text-center">제출 시간</th>
            <th className="border px-4 py-2 text-center">문제 보기</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((submission) => (
            <tr key={submission.submission_id} className="border text-sm">
              <td className="px-4 py-2 text-center">{submission.test_id}</td>
              <td className="px-4 py-2 text-center">{submission.title}</td>
              <td className="px-4 py-2 text-center">{submission.language}</td>
              <td className="px-4 py-2 text-center">
                {submission.is_correct ? "✅ 통과" : "❌ 실패"}
              </td>
              <td className="px-4 py-2 text-center">
                {submission.passed_test_cases} / {submission.total_test_cases}
              </td>
              <td className="px-4 py-2 text-center">{submission.submitted_at}</td>
              <td className="px-4 py-2 text-center">
                <button
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg"
                  onClick={() => navigate(`/codingtest/${submission.test_id}`)}
                >
                  보기
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            className={`px-3 py-2 rounded-lg ${
              currentPage === 1
                ? "bg-gray-300 text-gray-600"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
            disabled={currentPage === 1}
          >
            ◀
          </button>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index + 1)}
              className={`px-4 py-2 rounded-lg ${
                currentPage === index + 1
                  ? "bg-green-600 text-white"
                  : "bg-gray-300 text-gray-700"
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            className={`px-3 py-2 rounded-lg ${
              currentPage === totalPages
                ? "bg-gray-300 text-gray-600"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
            disabled={currentPage === totalPages}
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
};

export default SubmissionListTable;
