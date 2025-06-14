import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllSubmissionsByUser } from "../../../api/codingTestApi";
import { useAuth } from "../../../context/AuthContext";
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

const SubmissionListTable = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        if (!user?.user_id) {
          setError("로그인이 필요합니다.");
          setLoading(false);
          return;
        }
        const { submissions } = await getAllSubmissionsByUser(user.user_id);
        setSubmissions(submissions || []);
      } catch (err) {
        console.error("❌ 제출 목록 불러오기 실패:", err);
        setError("제출 내역을 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [user]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = submissions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(submissions.length / itemsPerPage));

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  if (loading)
    return <p className="text-sm text-gray-500 text-center mt-10">로딩 중...</p>;
  if (error)
    return <p className="text-sm text-red-500 text-center mt-10">{error}</p>;
  if (submissions.length === 0)
    return (
      <p className="text-sm text-gray-500 text-center mt-10">
        제출 기록이 없습니다.
      </p>
    );

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
                {submission.is_correct ? (
                  <CheckCircle className="text-green-600 inline-block" size={18} />
                ) : (
                  <XCircle className="text-red-500 inline-block" size={18} />
                )}
              </td>
              <td className="px-4 py-2 text-center">
                {submission.passed_test_cases} / {submission.total_test_cases}
              </td>
              <td className="px-4 py-2 text-center">{submission.submitted_at}</td>
              <td className="px-4 py-2 text-center">
                <button
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded flex items-center justify-center gap-1 mx-auto"
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
            className={`px-3 py-2 rounded-lg flex items-center justify-center ${
              currentPage === 1
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
            disabled={currentPage === 1}
          >
            <ArrowLeft size={18} />
          </button>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index + 1)}
              className={`px-4 py-2 rounded-lg ${
                currentPage === index + 1
                  ? "bg-green-600 text-white"
                  : "bg-gray-300 text-gray-700 hover:bg-gray-400"
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            className={`px-3 py-2 rounded-lg flex items-center justify-center ${
              currentPage === totalPages
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
            disabled={currentPage === totalPages}
          >
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default SubmissionListTable;
