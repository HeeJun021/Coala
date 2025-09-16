// frontend/src/components/portfolio/PortfolioHistory.jsx
import React, { useEffect, useMemo, useState } from "react";
import { History, CheckCircle, XCircle, Clock4, ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { getPortfolioExportHistory } from "../../api/portfolioApi";

const ITEMS_PER_PAGE = 15;

export default function PortfolioHistory() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { items: list = [], total: cnt = 0 } = await getPortfolioExportHistory({ page, limit: ITEMS_PER_PAGE });
        // 방어적 정규화
        const normalized = list.map((x) => ({
          export_id: x.export_id ?? x.id,
          title: x.title ?? "-",
          status: x.status ?? "pending", // 'pending' | 'success' | 'failed'
          block_count: x.block_count ?? 0,
          duration_ms: x.duration_ms ?? 0,
          created_at: x.created_at ?? null,
          page_id: x.page_id ?? null,
        }));
        setItems(normalized);
        setTotal(cnt);
      } catch (e) {
        console.error("❌ 포트폴리오 내역 불러오기 실패:", e);
        setErr("내역을 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const currentItems = useMemo(() => items, [items]);

  const goPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openNotion = (pageId) => {
    if (!pageId) return;
    window.open(`https://www.notion.so/${pageId.replaceAll("-", "")}`, "_blank", "noopener");
  };

return (
  <div className="relative min-h-screen">
    {/* 사이드바 영역 확보 */}
    <div className="w-full min-h-screen pt-4 pl-[164px]">
      {/* 메인 카드 컨테이너 (PortfolioExport와 동일 규격) */}
      <div className="max-w-5xl mx-auto mt-3 bg-white shadow-xl rounded-2xl border border-gray-300 p-7">

        {/* 타이틀 */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">포트폴리오 추출 내역</h1>
          <p className="text-sm text-gray-500 mt-1">
            노션으로 내보낸 기록을 한눈에 확인하세요.
          </p>
        </header>

        {/* 헤더 라인 */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-gray-800">
            <History className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">
              내보내기 목록{" "}
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
          <p className="text-sm text-gray-500">아직 내보낸 기록이 없습니다.</p>
        ) : (
          <>
            {/* 테이블 */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-gray-700 border-collapse">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="p-3 w-[90px] text-center">ID</th>
                    <th className="p-3 text-left">제목</th>
                    <th className="p-3 w-[110px] text-center">상태</th>
                    <th className="p-3 w-[120px] text-center">블록 수</th>
                    <th className="p-3 w-[140px] text-center">소요 시간</th>
                    <th className="p-3 w-[170px] text-center">생성 시간</th>
                    <th className="p-3 w-[120px] text-center">노션</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((x) => (
                    <tr key={x.export_id} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="p-3 text-center">{x.export_id}</td>
                      <td className="p-3 text-left truncate">{x.title}</td>
                      <td className="p-3 text-center">
                        {x.status === "success" ? (
                          <span className="inline-flex items-center gap-1 text-green-700">
                            <CheckCircle className="w-5 h-5" /> 성공
                          </span>
                        ) : x.status === "failed" ? (
                          <span className="inline-flex items-center gap-1 text-rose-600">
                            <XCircle className="w-5 h-5" /> 실패
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-600">
                            <Clock4 className="w-5 h-5" /> 진행중
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">{x.block_count}</td>
                      <td className="p-3 text-center">
                        {x.duration_ms ? `${Math.round(x.duration_ms / 100) / 10}s` : "-"}
                      </td>
                      <td className="p-3 text-center">
                        {x.created_at ? new Date(x.created_at).toLocaleString() : "-"}
                      </td>
                      <td className="p-3 text-center">
                        {x.page_id ? (
                          <button
                            onClick={() => openNotion(x.page_id)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md"
                          >
                            열기 <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
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

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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
  </div>
);

}
