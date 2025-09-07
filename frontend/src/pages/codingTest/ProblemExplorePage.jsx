import React, { useState } from "react";
import CodingTestSidebar from "../../Layout/CodingTestSidebar";

const LANG_OPTIONS = ["Python", "Java", "JavaScript"];
const LEVELS = [1, 2, 3, 4, 5];

// 임시 카테고리 (UI용 목데이터)
const CATEGORIES = [
  "카테고리 1",
  "카테고리 2",
  "카테고리 3",
  "카테고리 4",
  "카테고리 5",
  "카테고리 6",
  "카테고리 7",
  "카테고리 8",
  "카테고리 9",
  "카테고리 1",
  "카테고리 2",
  "카테고리 3",
  "카테고리 4",
  "카테고리 5",
  "카테고리 6",
  "카테고리 7",
  "카테고리 8",
  "카테고리 9",
];

const ProblemExplorePage = () => {
  const [lang, setLang] = useState(LANG_OPTIONS[0]);
  const [level, setLevel] = useState(null);
  const [selectedCats, setSelectedCats] = useState(new Set());

  const toggleCat = (name) => {
    const next = new Set(selectedCats);
    next.has(name) ? next.delete(name) : next.add(name);
    setSelectedCats(next);
  };

  const onSearch = () => {
    // TODO: API 연동 시 여기서 lang/level/selectedCats 사용
    console.log({ lang, level, categories: Array.from(selectedCats) });
  };

  return (
    <div className="relative min-h-screen">
      {/* 사이드바 */}
      <CodingTestSidebar />

      {/* 본문 */}
      <div className="ml-[100px] p-6 bg-[#F9FAFB] min-h-screen">
        <div className="max-w-5xl mx-auto bg-white rounded-xl border border-gray-200 shadow-lg mt-6 px-8 py-10">
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
            <p className="text-gray-700 font-medium mb-3">
              문제 유형을 선택하세요.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {CATEGORIES.map((name, idx) => {
                const active = selectedCats.has(`${name}-${idx}`);
                return (
                  <button
                    key={`${name}-${idx}`}
                    type="button"
                    onClick={() => toggleCat(`${name}-${idx}`)}
                    className={[
                      "px-4 py-2 rounded-md text-sm font-medium border transition-colors text-left",
                      active
                        ? "bg-green-100 text-green-800 border-green-300"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100",
                    ].join(" ")}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
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
};

export default ProblemExplorePage;
