// frontend/src/pages/codingTest/MyCodingTestSubmissionsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import CodingTestSidebar from "../../Layout/CodingTestSidebar";
import { getAllSubmissionsByUser } from "../../api/codingTestApi";
import { useAuth } from "../../context/AuthContext";
import {
  ListChecks,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

const ITEMS_PER_PAGE = 15;

const MyCodingTestSubmissionsPage = () => {
  const { user } = useAuth();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetch = async () => {
      try {
        if (!user?.user_id) {
          setErr("로그인이 필요합니다.");
          return;
        }
        const { submissions: list } = await getAllSubmissionsByUser(user.user_id);
        // 방어적 정규화(필드 이름 차이 대비)
        const normalized = (list || []).map((s) => ({
          submission_id: s.submission_id ?? s.id,
          test_id: s.test_id ?? s.problem_id ?? s.id,
          title: s.title ?? s.problem_title ?? "-",
          language: s.language ?? s.lang ?? "-",
          is_correct: !!s.is_correct,
          passed_test_cases: s.passed_test_cases ?? s.passed ?? 0,
          total_test_cases: s.total_test_cases ?? s.total ?? 0,
          submitted_at: s.submitted_at ?? s.created_at ?? null,
        }));
        setSubmissions(normalized);
      } catch (e) {
        console.error("❌ 제출 내역 불러오기 실패:", e);
        setErr("제출 내역을 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user?.user_id]);

  const totalPages = Math.max(1, Math.ceil(submissions.length / ITEMS_PER_PAGE));
  const currentItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return submissions.slice(start, start + ITEMS_PER_PAGE);
  }, [submissions, page]);

  const goPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="w-full min-h-screen pt-4 pl-[144px] bg-[#F9FAFB]">
      {/* 좌측 사이드바 (퀴즈 규격과 동일 위치/폭) */}
      <CodingTestSidebar />

      {/* 본문 카드 — 퀴즈 제출 내역 카드 규격과 동일 */}
      <div className="max-w-5xl mx-auto pt-8 mt-8 bg-white shadow-xl rounded-2xl border border-gray-300 p-7 relative">
        {/* 타이틀 */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-4 tracking-wide">
            코딩테스트 제출 내역
          </h1>
          <p className="text-gray-500 text-sm">
            내가 제출했던 코드를 한눈에 확인하세요.
          </p>
        </div>

        {/* 헤더 라인 (총 개수) */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-gray-800">
            <ListChecks className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">
              제출 목록{" "}
              <span className="text-sm font-normal text-gray-500">
                · 총 <strong>{submissions.length}</strong>건
              </span>
            </h2>
          </div>
        </div>

        {/* 컨텐츠 상태 */}
        {loading ? (
          <p className="text-sm text-gray-500">로딩 중...</p>
        ) : err ? (
          <p className="text-sm text-red-500">{err}</p>
        ) : submissions.length === 0 ? (
          <p className="text-sm text-gray-500">제출 기록이 없습니다.</p>
        ) : (
          <>
            {/* 테이블 (퀴즈 제출 내역 톤 그대로) */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-gray-700 border-collapse">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="p-3 w-[90px] text-center">문제 ID</th>
                    <th className="p-3 text-left">제출 제목</th>
                    <th className="p-3 w-[120px] text-center">언어</th>
                    <th className="p-3 w-[110px] text-center">채점 결과</th>
                    <th className="p-3 w-[140px] text-center">테스트케이스</th>
                    <th className="p-3 w-[170px] text-center">제출 시간</th>
                    <th className="p-3 w-[110px] text-center">문제 보기</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((s) => (
                    <tr
                      key={s.submission_id}
                      className="hover:bg-gray-50 border-b border-gray-100"
                    >
                      <td className="p-3 text-center">{s.test_id}</td>
                      <td className="p-3 text-left truncate">{s.title}</td>
                      <td className="p-3 text-center">{s.language}</td>
                      <td className="p-3 text-center">
                        {s.is_correct ? (
                          <CheckCircle className="w-5 h-5 text-green-600 inline-block align-middle" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-500 inline-block align-middle" />
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {s.passed_test_cases} / {s.total_test_cases}
                      </td>
                      <td className="p-3 text-center">
                        {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "-"}
                      </td>
                      <td className="p-3 text-center">
                        <a
                          href={`/codingtest/${s.test_id}`}
                          className="inline-block px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md"
                        >
                          보기
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 (퀴즈 페이지 스타일) */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 gap-2">
                <button
                  onClick={() => goPage(page - 1)}
                  className={`px-3 py-2 rounded-md flex items-center justify-center ${
                    page === 1
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                  disabled={page === 1}
                  aria-label="이전 페이지"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => goPage(p)}
                    className={`px-3 py-1.5 rounded-md border text-sm ${
                      page === p ? "bg-green-600 text-white" : "hover:bg-gray-100 text-gray-700"
                    }`}
                    aria-current={page === p ? "page" : undefined}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => goPage(page + 1)}
                  className={`px-3 py-2 rounded-md flex items-center justify-center ${
                    page === totalPages
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                  disabled={page === totalPages}
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
  );
};

export default MyCodingTestSubmissionsPage;
