import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  History,
  CheckCircle,
  XCircle,
  Clock4,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { getPortfolioExportHistory } from "../../api/portfolioApi";

const ITEMS_PER_PAGE = 15;

// 사이드바와 동일한 파라미터 (포뮬러 일치)
const BASE_TOP = 5;
const SCROLL_FACTOR = 0.2;
const EASE = 0.15;

// 🔧 사이드바 대비 시각적 보정(위로 당김). 필요 시 -12 ~ -20에서 미세조정.
const ALIGN_OFFSET = -16;

export default function PortfolioHistory() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // ===== 사이드바와 같은 Y 공식 + 정렬 오프셋 =====
  const [posY, setPosY] = useState(BASE_TOP);
  const targetYRef = useRef(BASE_TOP);
  const rafRef = useRef(0);

  useEffect(() => {
    const tick = () => {
      setPosY((prev) => {
        const next = prev + (targetYRef.current - prev) * EASE;
        rafRef.current = requestAnimationFrame(tick);
        return next;
      });
    };
    const updateTarget = () => {
      targetYRef.current = BASE_TOP + window.scrollY * SCROLL_FACTOR;
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", updateTarget, { passive: true });
    window.addEventListener("resize", updateTarget);
    updateTarget();
    return () => {
      window.removeEventListener("scroll", updateTarget);
      window.removeEventListener("resize", updateTarget);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { items: list = [], total: cnt = 0 } =
          await getPortfolioExportHistory({
            page,
            limit: ITEMS_PER_PAGE,
          });

        const normalized = list.map((x) => ({
          export_id: x.export_id ?? x.id,
          title: x.title ?? "-",
          status: x.status ?? "pending",
          block_count: x.block_count ?? 0,
          duration_ms: x.duration_ms ?? 0,
          created_at: x.created_at ?? null,
          page_id: x.page_id ?? null,
          project_name: x.project_name ?? "-",
          template_name: x.template_name ?? "-",
          ai_used: x.ai_used ?? false,
          error_msg: x.error_msg ?? null,
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
    window.open(
      `https://www.notion.so/${pageId.replaceAll("-", "")}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
  // 상단 패딩 없이, 카드 컨테이너만 Y를 맞춤 (사이드바와 동일 포뮬러 + ALIGN_OFFSET=5 권장)
  <div className="w-full min-h-screen pl-[144px] bg-[#F9FAFB]" data-scroll-root>
    <div
      className="max-w-5xl mx-auto bg-white shadow-xl rounded-2xl border border-gray-300 p-7 relative"
      style={{ transform: `translateY(${posY + ALIGN_OFFSET}px)` }}
    >
      {/* 타이틀 — 코딩테스트 페이지와 동일한 타이포/여백 */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-4 tracking-wide">
          포트폴리오 추출 내역
        </h1>
        <p className="text-gray-500 text-sm">
          노션으로 내보낸 기록을 한눈에 확인하세요.
        </p>
      </div>

      {/* 헤더 라인 (총 개수) — 코딩테스트 스타일과 동일 톤 */}
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
          {/* 테이블 — 코딩테스트 테이블과 동일하게 border-collapse 사용 */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-gray-700 border-collapse">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="p-3 w-[8%] text-center">ID</th>
                  <th className="p-3 w-[25%] text-left">제목</th>
                  <th className="p-3 w-[12%] text-center">상태</th>
                  <th className="p-3 w-[18%] text-center">프로젝트</th>
                  <th className="p-3 w-[20%] text-center">템플릿</th>
                  <th className="p-3 w-[15%] text-center">생성 시간</th>
                  <th className="p-3 w-[10%] text-center whitespace-nowrap">노션</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((x) => (
                  <tr
                    key={x.export_id}
                    className="hover:bg-gray-50 border-b border-gray-100"
                  >
                    <td className="p-3 text-center">{x.export_id}</td>
                    <td className="p-3 text-left truncate">{x.title}</td>
                    <td className="p-3 text-center whitespace-nowrap">
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
                    <td className="p-3 text-center">{x.project_name ?? "-"}</td>
                    <td className="p-3 text-center">{x.template_name ?? "-"}</td>
                    <td className="p-3 text-center">
                      {x.created_at ? new Date(x.created_at).toLocaleString() : "-"}
                    </td>
                    <td className="p-3 text-center">
                      {x.page_id ? (
                        <button
                          onClick={() => openNotion(x.page_id)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md whitespace-nowrap leading-none"
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

          {/* 페이지네이션 — 코딩테스트 페이지와 동일 스타일 */}
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

}
