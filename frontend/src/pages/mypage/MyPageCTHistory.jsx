import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getAllSubmissionsByUser } from "../../api/codingTestApi";
import {
  CheckCircle,
  XCircle,
  History,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

const MyPageCTHistory = () => {
  const navigate = useNavigate();
  const { userData } = useOutletContext();

  const [submissionHistory, setSubmissionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15; // 포트폴리오와 동일하게 15로 설정

  useEffect(() => {
    if (!userData?.user_id) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    const fetchSubmissions = async () => {
      try {
        setLoading(true); // 로딩 시작
        const { submissions } = await getAllSubmissionsByUser(userData.user_id);
        
        if (!submissions) {
          setSubmissionHistory([]);
        } else {
          // 최신순으로 정렬
          const sortedSubmissions = submissions.sort((a, b) => 
            new Date(b.submitted_at) - new Date(a.submitted_at)
          );
          setSubmissionHistory(sortedSubmissions);
        }

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

  return (
    <div className="flex min-h-screen">
      {/* ✅ MyPagePortfolioHistory와 동일한 좌측 여백 */}
      <div className="w-[200px]" />

      {/* ✅ 메인 콘텐츠 */}
      <div className="flex-1 p-6 max-w-6xl mx-auto">
        <div className="max-w-5xl bg-white shadow-xl rounded-2xl border border-gray-300 p-7 relative ml-4">
          {/* 타이틀 */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-4 tracking-wide">
              코딩 테스트 제출 내역
            </h1>
            <p className="text-gray-500 text-sm">
              제출한 코딩 테스트 기록을 한눈에 확인하세요.
            </p>
          </div>

          {/* 헤더 라인 (총 개수) */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-gray-800">
              <History className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold">
                제출 목록{" "}
                <span className="text-sm font-normal text-gray-500">
                  · 총 <strong>{submissionHistory.length}</strong>건
                </span>
              </h2>
            </div>
          </div>

          {/* 상태 */}
          {loading ? (
            <p className="text-sm text-gray-500 text-center py-10">로딩 중...</p>
          ) : error ? (
            <p className="text-sm text-red-500 text-center py-10">{error}</p>
          ) : submissionHistory.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10">아직 제출한 기록이 없습니다.</p>
          ) : (
            <>
              {/* 테이블 */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-gray-700 border-collapse">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="p-3 w-[10%] text-center">문제 ID</th>
                      <th className="p-3 w-[25%] text-left">제출 제목</th>
                      <th className="p-3 w-[10%] text-center">언어</th>
                      <th className="p-3 w-[15%] text-center">채점 결과</th>
                      <th className="p-3 w-[15%] text-center">테스트케이스</th>
                      <th className="p-3 w-[15%] text-center">제출 시간</th>
                      <th className="p-3 w-[10%] text-center">문제 보기</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((submission) => (
                      <tr
                        key={submission.submission_id}
                        className="hover:bg-gray-50 border-b border-gray-100"
                      >
                        <td className="p-3 text-center">{submission.test_id}</td>
                        <td className="p-3 text-left truncate">{submission.title}</td>
                        <td className="p-3 text-center">{submission.language}</td>
                        <td className="p-3 text-center whitespace-nowrap">
                          {submission.is_correct ? (
                            <span className="inline-flex items-center gap-1 text-green-700">
                              <CheckCircle className="w-5 h-5" /> 성공
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600">
                              <XCircle className="w-5 h-5" /> 실패
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {submission.passed_test_cases} / {submission.total_test_cases}
                        </td>
                        <td className="p-3 text-center">
                          {new Date(submission.submitted_at).toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => navigate(`/codingtest/${submission.test_id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md whitespace-nowrap leading-none"
                          >
                            보기 <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6 gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={`px-3 py-2 rounded-md flex items-center justify-center ${
                      currentPage === 1
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                    disabled={currentPage === 1}
                    aria-label="이전 페이지"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`px-3 py-1.5 rounded-md border text-sm ${
                          currentPage === p
                            ? "bg-green-600 text-white"
                            : "hover:bg-gray-100 text-gray-700"
                        }`}
                        aria-current={currentPage === p ? "page" : undefined}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={`px-3 py-2 rounded-md flex items-center justify-center ${
                      currentPage === totalPages
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                    disabled={currentPage === totalPages}
                    aria-label="다음 페이지"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyPageCTHistory;