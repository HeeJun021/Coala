// src/pages/quiz/QuizHistoryPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getUserQuizHistory } from "../../api/quizApi";
import QuizSideBar from "../../Layout/QuizSideBar";
import {
  HelpCircle,
  ListChecks,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Target,       // practice
  PencilLine,   // test
} from "lucide-react";

const ITEMS_PER_PAGE = 15;

const TABS = [
  { key: "all", label: "전체", Icon: ListChecks },
  { key: "practice", label: "연습", Icon: Target },
  { key: "test", label: "테스트", Icon: PencilLine },
];

const QuizHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 가이드(동일 규격)
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [showGuideTooltip, setShowGuideTooltip] = useState(false);
  useEffect(() => {
    const seen = localStorage.getItem("quiz_guide_seen");
    if (seen !== "true") setShowGuideTooltip(true);
  }, []);
  const handleGuideClick = () => {
    setIsGuideOpen(true);
    setShowGuideTooltip(false);
    localStorage.setItem("quiz_guide_seen", "true");
  };

  // 데이터
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // 필터/페이지네이션
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetch = async () => {
      try {
        if (!user?.user_id) {
          setErr("로그인이 필요합니다.");
          return;
        }
        const res = await getUserQuizHistory(user.user_id);

        // 응답: 배열 혹은 {submissions: []} 대응
        const raw = Array.isArray(res) ? res : res?.submissions || [];

        // 정규화 (total_questions 키 우선 사용)
        const normalized = raw.map((s) => {
          const total =
            s.total_questions ??
            s.total_count ??
            s.question_count ??
            (Array.isArray(s.questions) ? s.questions.length : undefined) ??
            0;

          const correct =
            s.correct_count ??
            s.correct ??
            s.num_correct ??
            0;

          return {
            submission_id: s.submission_id ?? s.id ?? `${s.quiz_id ?? s.quizId}-${s.submitted_at ?? ""}`,
            quiz_id: s.quiz_id ?? s.quizId ?? s.id,
            title: s.title ?? s.quiz_title ?? "-",
            language: s.language ?? s.language_name ?? "-",
            quiz_type: s.quiz_type ?? "practice", // 기본값
            is_correct:
              typeof s.is_correct === "boolean"
                ? s.is_correct
                : (correct > 0 && correct === total),
            correct_count: typeof correct === "number" ? correct : 0,
            total_count: typeof total === "number" ? total : 0,
            submitted_at: s.submitted_at ?? s.created_at ?? s.updated_at ?? null,
            rating_change: typeof s.rating_change === "number" ? s.rating_change : 0,
          };
        });

        setSubmissions(normalized);
      } catch (e) {
        console.error("❌ 퀴즈 제출 내역 불러오기 실패:", e);
        setErr("제출 내역을 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user?.user_id]);

  // 유형별 카운트(배지)
  const counts = useMemo(() => {
    const c = { all: submissions.length, practice: 0, test: 0, review: 0 };
    for (const s of submissions) {
      if (s.quiz_type === "practice") c.practice += 1;
      else if (s.quiz_type === "test") c.test += 1;
      else if (s.quiz_type === "review") c.review += 1;
    }
    return c;
  }, [submissions]);

  // 필터 적용
  const filtered = useMemo(() => {
    if (tab === "all") return submissions;
    return submissions.filter((s) => s.quiz_type === tab);
  }, [submissions, tab]);

  // 페이지네이션
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  const goPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    setPage(1);
  }, [tab]);

  return (
    <div className="w-full min-h-screen pt-4 pl-[164px]">
      {/* 좌측 사이드바 */}
      <QuizSideBar />

      {/* 본문 카드 */}
      <div className="max-w-6xl mx-auto pt-8 mt-8 bg-white shadow-xl rounded-2xl border border-gray-300 p-7 relative">
        {/* 가이드 버튼 */}
        <button
          onClick={handleGuideClick}
          className="absolute top-4 right-4 text-gray-500 hover:text-black"
          title="가이드 보기"
        >
          <HelpCircle size={24} />
          {showGuideTooltip && (
            <div className="absolute top-[-2px] right-[-6px] w-[7px] h-[7px] bg-rose-600 rounded-full shadow-sm" />
          )}
        </button>

        {/* 타이틀 */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-4 tracking-wide">
            <span className="text-black">제출 내역</span>
          </h1>
          <p className="text-gray-500 text-sm">
            내가 풀었던 퀴즈의 제출 기록을 유형별로 확인해보세요.
          </p>
        </div>

        {/* 탭 필터 */}
        <div className="flex flex-wrap gap-2 mb-5">
          {TABS.map(({ key, label, Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "border-green-300 bg-green-50 text-green-700"
                    : "border-gray-200 bg-gray-50 text-gray-700 hover:border-green-300",
                ].join(" ")}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                <span className="text-xs bg-white/70 border border-gray-200 rounded-full px-2 py-[1px]">
                  {counts[key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* 제출 목록 헤더 */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-gray-800">
            <ListChecks className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">
              제출 목록{" "}
              <span className="text-sm font-normal text-gray-500">
                · 총 <strong>{filtered.length}</strong>건
              </span>
            </h2>
          </div>
        </div>

        {/* 상태/테이블 */}
        {loading ? (
          <p className="text-sm text-gray-500">로딩 중...</p>
        ) : err ? (
          <p className="text-sm text-red-500">{err}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500">해당 유형의 제출 기록이 없습니다.</p>
        ) : (
          <>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-gray-700 border-collapse">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="p-3 w-[90px] text-center">퀴즈 ID</th>
                    <th className="p-3 text-left">퀴즈 제목</th>
                    <th className="p-3 w-[110px] text-center">유형</th>
                    <th className="p-3 w-[110px] text-center">결과</th>
                    <th className="p-3 w-[150px] text-center">정답/문항</th>
                    <th className="p-3 w-[170px] text-center">제출 시간</th>
                    <th className="p-3 w-[110px] text-center">결과 보기</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((s) => (
                    <tr key={s.submission_id} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="p-3 text-center">{s.quiz_id}</td>
                      <td className="p-3 text-left truncate">{s.title}</td>
                      <td className="p-3 text-center">
                        {s.quiz_type === "test" ? "테스트" : s.quiz_type === "review" ? "복습" : "연습"}
                      </td>
                      <td className="p-3 text-center">
                        {s.is_correct ? (
                          <CheckCircle className="w-5 h-5 text-green-600 inline-block align-middle" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-500 inline-block align-middle" />
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {s.correct_count} / {s.total_count}
                      </td>
                      <td className="p-3 text-center">
                        {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "-"}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md"
                          onClick={() => navigate(`/quiz-result/${s.quiz_id}`)} // 결과 페이지로 이동
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

      {/* (선택) 가이드 모달 연결 필요 시 여기에서 열기 */}
      {isGuideOpen && null}
    </div>
  );
};

export default QuizHistoryPage;
