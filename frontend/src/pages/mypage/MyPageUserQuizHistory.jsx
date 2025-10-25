// src/pages/mypage/MyPageUserQuizHistory.jsx
// ✅ MyPagePortfolioHistory.jsx 디자인 기준으로 완전 통일 버전

import React, { useEffect, useMemo, useState } from "react";
import {
  History,
  CheckCircle,
  CalendarClock,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getUserQuizHistory } from "../../api/userQuizApi";

const ITEMS_PER_PAGE = 15;

export default function MyPageUserQuizHistory() {
  const navigate = useNavigate();
  const { userData } = useOutletContext();

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      if (!userData?.user_id) {
        setErr("로그인이 필요합니다.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getUserQuizHistory(userData.user_id);
        const normalized = (data || []).map((q) => ({
          id: q.uq_submission_id ?? q.id,
          title: q.title ?? "-",
          correct_count: q.correct_count ?? 0,
          submitted_at: q.submitted_at ?? null,
          creator_name: q.creator_name ?? "-",
        }));
        setItems(normalized);
        setErr(null);
      } catch (e) {
        console.error("❌ 사용자 퀴즈 내역 불러오기 실패:", e);
        setErr("데이터를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userData]);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const currentItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, page]);

  const goPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  const goResult = (id) => {
    navigate(`/user-quiz-result/${id}`);
  };

  return (
    <div className="flex min-h-screen">
      {/* 좌측 여백 */}
      <div className="w-[200px]" />

      {/* 메인 콘텐츠 */}
      <div className="flex-1 p-6 max-w-6xl mx-auto">
        <div className="max-w-5xl bg-white shadow-xl rounded-2xl border border-gray-300 p-7 relative ml-4">
          {/* 타이틀 */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-4 tracking-wide">
              사용자 퀴즈 풀이 내역
            </h1>
            <p className="text-gray-500 text-sm">
              내가 참여한 사용자 제작 퀴즈 결과를 확인할 수 있습니다.
            </p>
          </div>

          {/* 헤더 (총 개수) */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-gray-800">
              <History className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold">
                풀이 기록{" "}
                <span className="text-sm font-normal text-gray-500">
                  · 총 <strong>{total}</strong>건
                </span>
              </h2>
            </div>
          </div>

          {/* 상태 */}
          {loading ? (
            <p className="text-sm text-gray-500">로딩 중...</p>
          ) : err ? (
            <p className="text-sm text-red-500">{err}</p>
          ) : total === 0 ? (
            <p className="text-sm text-gray-500">풀이한 퀴즈가 없습니다.</p>
          ) : (
            <>
              {/* 테이블 */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-gray-700 border-collapse">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="p-3 w-[35%] text-left">퀴즈 제목</th>
                      <th className="p-3 w-[15%] text-center">정답 개수</th>
                      <th className="p-3 w-[25%] text-center">제출 날짜</th>
                      <th className="p-3 w-[15%] text-center">제작자</th>
                      <th className="p-3 w-[10%] text-center">결과</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((q) => (
                      <tr
                        key={q.id}
                        className="hover:bg-gray-50 border-b border-gray-100"
                      >
                        <td className="p-3 text-left truncate">{q.title}</td>
                        <td className="p-3 text-center text-green-600">
                          <div className="inline-flex items-center gap-1 justify-center">
                            <CheckCircle className="w-4 h-4" />
                            {q.correct_count}
                          </div>
                        </td>
                        <td className="p-3 text-center text-gray-700 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 justify-center">
                            <CalendarClock className="w-4 h-4" />
                            {q.submitted_at
                              ? new Date(q.submitted_at).toLocaleString()
                              : "-"}
                          </div>
                        </td>
                        <td className="p-3 text-center">{q.creator_name}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => goResult(q.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md whitespace-nowrap leading-none"
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

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => goPage(p)}
                        className={`px-3 py-1.5 rounded-md border text-sm ${
                          page === p
                            ? "bg-green-600 text-white"
                            : "hover:bg-gray-100 text-gray-700"
                        }`}
                        aria-current={page === p ? "page" : undefined}
                      >
                        {p}
                      </button>
                    )
                  )}

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
    </div>
  );
}
