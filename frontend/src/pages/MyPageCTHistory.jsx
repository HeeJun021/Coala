import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getAllSubmissionsByUser } from "../api/codingTestApi";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react"; // ✅ 필요한 아이콘만

const MyPageCTHistory = () => {
  const navigate = useNavigate();
  const { userData } = useOutletContext();

  const [submissionHistory, setSubmissionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    if (!userData?.user_id) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    const fetchSubmissions = async () => {
      try {
        const { submissions } = await getAllSubmissionsByUser(userData.user_id);
        if (!submissions || submissions.length === 0) {
          setError("코딩 테스트 제출 기록이 없습니다.");
          return;
        }
        setSubmissionHistory(submissions);
      } catch (err) {
        console.error("❌ 제출 기록 조회 실패:", err);
        setError("제출 기록을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [userData]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = submissionHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(submissionHistory.length / itemsPerPage));

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  if (loading) return <p className="text-sm text-gray-500 text-center mt-10">로딩 중...</p>;
  if (error) return <p className="text-sm text-red-500 text-center mt-10">{error}</p>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-[250px]" />
      <div className="flex-1 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">코딩 테스트 제출 내역</h2>

        <div className="bg-white shadow-md rounded-lg p-6">
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
                <tr key={submission.submission_id} className="border">
                  <td className="px-4 py-2 text-center">{submission.test_id}</td>
                  <td className="px-4 py-2 text-center">{submission.title}</td>
                  <td className="px-4 py-2 text-center">{submission.language}</td>
                  <td className="px-4 py-2 text-center">
                    {submission.is_correct ? (
                      <CheckCircle className="w-5 h-5 text-green-600 inline" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 inline" />
                    )}
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
        </div>

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
              <ChevronLeft size={18} />
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
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPageCTHistory;
