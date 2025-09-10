// src/pages/codingtest/ProblemExplorePage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CodingTestSidebar from "../../Layout/CodingTestSidebar";
import { getCodingTestList } from "../../api/codingTestApi";

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

  // 압축 UI 상태
  const filteredCats = categories; // 그냥 전체 사용

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
          // 필요 시 언어별 카테고리만 보고싶으면 아래 라인 사용
          // lang: lang.toLowerCase(),
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
  }, []); // 언어별로 달라지게 하려면 deps에 lang 추가

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
            <h1 className="text-3xl font-extrabold text-gray-900">문제 탐색</h1>
          </div>

          {/* 언어 선택 */}
          <div className="mt-8">
            <label className="block text-gray-700 font-medium mb-2">
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
            <p className="text-gray-700 font-medium mb-3">
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
              <p className="text-gray-700 font-medium">
                문제 유형을 선택하세요.
              </p>
            </div>

            {loadingCats ? (
              <div className="text-sm text-gray-500">
                카테고리를 불러오는 중…
              </div>
            ) : catErr ? (
              <div className="text-sm text-rose-600">{catErr}</div>
            ) : (
              <>
                {/* 자동 채움 그리드: 한 화면에 최대한 많이 */}
                <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]">
                  {filteredCats.map((name) => {
                    const active = selectedCats.has(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleCat(name)}
                        className={[
                          "w-full truncate px-3 py-1.5 rounded-md text-xs font-medium border transition-colors text-left",
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

                {/* 선택 요약 */}
                {selectedCats.size > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Array.from(selectedCats)
                      .slice(0, 10)
                      .map((n) => (
                        <span
                          key={n}
                          className="inline-flex items-center rounded-full border border-green-200 bg-green-50 text-green-700 px-2.5 py-1 text-xs"
                        >
                          {n}
                          <button
                            type="button"
                            onClick={() => toggleCat(n)}
                            className="ml-1 hover:text-green-900"
                            aria-label={`${n} 제거`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    {selectedCats.size > 10 && (
                      <span className="text-xs text-gray-500">
                        외 {selectedCats.size - 10}개…
                      </span>
                    )}
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
              className="px-5 py-2 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 shadow"
            >
              검색
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
