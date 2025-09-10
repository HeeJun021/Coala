// src/pages/codingtest/ProblemExplorePage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CodingTestSidebar from "../../Layout/CodingTestSidebar";
import { getCodingTestList } from "../../api/codingTestApi";
// ✅ 아이콘 추가 (PracticeQuiz 톤 앤 매너)
import {
  Search as SearchIcon,
  Tags,
  X as XIcon,
  RefreshCw,
} from "lucide-react";

const LANG_OPTIONS = ["Python", "Java", "JavaScript"];
const LEVELS = [1, 2, 3, 4, 5];

export default function ProblemExplorePage() {
  const navigate = useNavigate();

  const [lang, setLang] = useState(LANG_OPTIONS[0]);
  const [level, setLevel] = useState(null);

  // 서버 카테고리
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [catErr, setCatErr] = useState("");

  // 선택 상태
  const [selectedCats, setSelectedCats] = useState(new Set());
  const toggleCat = (name) => {
    const next = new Set(selectedCats);
    next.has(name) ? next.delete(name) : next.add(name);
    setSelectedCats(next);
  };

  // 압축 UI 상태 (검색/더보기 제거 후 전체 사용)
  const filteredCats = categories;

  // 카테고리 로딩
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingCats(true);
        setCatErr("");
        const res = await getCodingTestList({
          page: 1,
          sort: "desc",
          // lang: lang.toLowerCase(), // 필요 시 언어별 카테고리만
        });
        const list =
          res?.category_counts?.map((c) => c.category).filter(Boolean) ?? [];
        if (mounted) setCategories(list);
      } catch (e) {
        if (mounted) setCatErr("카테고리를 불러오지 못했습니다.");
        console.error(e);
      } finally {
        if (mounted) setLoadingCats(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onSearch = () => {
    const langToParam = lang.toLowerCase();
    const catParam = Array.from(selectedCats).join(",");

    const params = new URLSearchParams();
    params.set("page", "1");
    if (level) params.set("level", String(level));
    if (catParam) params.set("category", catParam);
    if (langToParam) params.set("lang", langToParam);

    navigate(`/codingtest?${params.toString()}`);
  };

  return (
    <div className="relative min-h-screen">
      {/* 사이드바 */}
      <CodingTestSidebar />

      {/* 본문 */}
      <div className="ml-[100px] p-6 bg-[#F9FAFB] min-h-screen">
        <div className="max-w-5xl mx-auto pt-8 mt-8 bg-white shadow-xl rounded-2xl border border-gray-300 p-7 relative">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2 tracking-wide">
              문제 탐색
            </h1>
          </div>
          <p className="text-gray-500 text-sm mt-6 text-left">
            원하는 <span className="font-medium text-gray-700">문제 유형</span>
            과 <span className="font-medium text-gray-700">난이도</span>를
            선택해 자유롭게 탐색해보세요!
          </p>

          {/* 언어 선택 */}
          <div className="mt-8">
            <label className="text-gray-700 font-medium mb-2 flex items-center gap-2">
              언어 선택
            </label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="w-40 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
            >
              {LANG_OPTIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* 난이도 선택 */}
          <div className="mt-8">
            <p className="text-gray-700 font-medium mb-3 flex items-center gap-2">
              난이도를 선택하세요.
            </p>
            <div className="flex flex-wrap gap-3">
              {LEVELS.map((lv) => {
                const active = level === lv;
                return (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => setLevel(active ? null : lv)}
                    className={[
                      "min-w-[64px] px-4 py-2 rounded-md text-sm font-semibold border transition-colors",
                      active
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100",
                    ].join(" ")}
                  >
                    Lv. {lv}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 카테고리 선택 */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-700 font-medium flex items-center gap-2">
                <Tags className="w-5 h-5 text-green-600" />
                문제 유형을 선택하세요.
              </p>

              {/* 선택 개수 뱃지 (기능 변경 없음, 시각만) */}
              <span className="text-xs text-gray-500">
                선택됨{" "}
                <span className="font-semibold text-gray-700">
                  {selectedCats.size}
                </span>
                개
              </span>
            </div>

            {loadingCats ? (
              <div className="text-sm text-gray-500">
                카테고리를 불러오는 중…
              </div>
            ) : catErr ? (
              <div className="text-sm text-rose-600">{catErr}</div>
            ) : (
              <>
                {/* 자동 채움 그리드 */}
                <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]">
                  {filteredCats.map((name) => {
                    const active = selectedCats.has(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleCat(name)}
                        className={[
                          "w-full truncate px-3 py-1.5 rounded-md text-xs font-medium border transition-colors text-left flex items-center gap-1.5",
                          active
                            ? "bg-green-100 text-green-800 border-green-300"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100",
                        ].join(" ")}
                        title={name}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>

                {/* ✅ 선택된 카테고리 칩 (선택 시에만 노출) */}
                {selectedCats.size > 0 && (
                  <div className="transition-all duration-300 overflow-hidden mt-4">
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-green-100 bg-green-50/50 px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCats(new Set())}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                        title="선택 초기화"
                      >
                        <RefreshCw className="w-3 h-3" />
                        초기화
                      </button>

                      {Array.from(selectedCats).map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center rounded-full border border-green-200 bg-white text-green-700 px-2.5 py-1 text-xs shadow-sm"
                        >
                          {c}
                          <button
                            type="button"
                            onClick={() => toggleCat(c)}
                            className="ml-1 hover:text-green-900"
                            aria-label={`${c} 제거`}
                            title="제거"
                          >
                            <XIcon className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 검색 버튼 */}
          <div className="mt-10 flex justify-end">
            <button
              type="button"
              onClick={onSearch}
              className="px-5 py-2 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 shadow inline-flex items-center gap-2"
            >
              <SearchIcon className="w-4 h-4" />
              검색
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
