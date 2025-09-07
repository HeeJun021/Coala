import React, { useEffect, useState, useRef, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  getCodingTestList,
  setPreferredCodingLang,
  getMyPreferredCodingLang,
} from "../../api/codingTestApi";
import { useAuth } from "../../context/AuthContext";
import {
  ListChecks,
  FileCode,
  Check,
  ArrowUpDown,
  Search,
  X,
  ChevronDown,
  RefreshCw,
  Coffee, // JAVA용
  Braces, // JavaScript용
  Code, // Python용 (없으면 추가)
} from "lucide-react";

const getLevelClass = (level) => {
  switch (level) {
    case 1:
      return "bg-green-200 text-green-800";
    case 2:
      return "bg-lime-200 text-lime-800";
    case 3:
      return "bg-yellow-200 text-yellow-800";
    case 4:
      return "bg-orange-200 text-orange-800";
    case 5:
      return "bg-rose-200 text-rose-800";
    default:
      return "bg-gray-200 text-gray-600";
  }
};

const CodingTestPage = () => {
  const { user } = useAuth(); // ✅ 사용자 정보 가져오기
  const [searchParams, setSearchParams] = useSearchParams();

  const LANG_OPTIONS = [
    { value: "python", label: "PYTHON" },
    { value: "java", label: "JAVA" },
    { value: "javascript", label: "JAVASCRIPT" },
  ];
  const [preferredLang, setPreferredLang] = useState(
    user?.preferred_coding_lang || ""
  );

  const [problems, setProblems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState([]);

  const page = parseInt(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || "";
  const level = searchParams.get("level") || "";
  const status = searchParams.get("status") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "desc";

  // 🔎 카테고리 다중 선택 상태
  const [catOpen, setCatOpen] = useState(false);
  const [selectedCats, setSelectedCats] = useState(() =>
    category ? category.split(",") : []
  );
  const catPanelRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState(search);
  // ✅ URL 쿼리(category=a,b,c)를 기준으로 '적용된' 카테고리 목록
  const committedCats = useMemo(
    () => (category ? category.split(",") : []),
    [category]
  );

  // ✅ 칩에서 X 눌렀을 때 해당 카테고리만 제거
  const removeCommittedCat = (cat) => {
    const next = committedCats.filter((c) => c !== cat);
    setSearchParams({
      page: 1,
      search,
      level,
      status,
      sort,
      ...(next.length ? { category: next.join(",") } : {}),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ✅ 전체 초기화
  const clearCommittedCats = () => {
    setSearchParams({
      page: 1,
      search,
      level,
      status,
      sort,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const res = await getCodingTestList({
          page,
          search,
          level,
          status,
          category,
          sort,
          ...(user?.user_id && { user_id: user.user_id }), // ✅ 조건부 user_id 전달
        });
        setProblems(res.problems);
        setTotalCount(res.total);
        setCategoryCounts(res.category_counts);
      } catch (err) {
        console.error("문제 목록 불러오기 실패:", err);
      }
    };
    fetchProblems();
  }, [page, search, level, status, category, sort, user]);

  // URL의 category 쿼리가 바뀌면 로컬 선택도 동기화
  useEffect(() => {
    setSelectedCats(category ? category.split(",") : []);
  }, [category]);

  // 카테고리 패널 바깥 클릭 시 닫기
  useEffect(() => {
    const onClickOutside = (e) => {
      if (!catPanelRef.current) return;
      if (!catPanelRef.current.contains(e.target)) setCatOpen(false);
    };
    if (catOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [catOpen]);

  // 사용자 정보 변경/로그인 시 서버에서 선호 언어 로드
  useEffect(() => {
    let mounted = true;
    if (!user?.user_id) {
      // 비로그인: placeholder 유지
      setPreferredLang("");
      return () => {
        mounted = false;
      };
    }
    (async () => {
      try {
        // 컨텍스트에 있으면 우선 사용, 없으면 서버 조회
        const fromCtx = user?.preferred_coding_lang || "";
        const pref = fromCtx || (await getMyPreferredCodingLang());
        if (mounted) setPreferredLang(pref || ""); // 없으면 placeholder 유지
      } catch (e) {
        console.warn("선호 언어 조회 실패:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.user_id, user?.preferred_coding_lang]);

  // 선호 언어 변경 → 서버 저장(PATCH)
  const handlePreferredLangChange = async (e) => {
    const next = e.target.value;
    setPreferredLang(next); // optimistic
    if (!user?.user_id || !next) return; // 비로그인 또는 placeholder면 저장 안 함
    try {
      await setPreferredCodingLang(next);
    } catch (err) {
      console.error("선호 언어 저장 실패:", err);
    }
  };

  // 카테고리 토글
  const toggleCat = (cat) => {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const resetCats = () => setSelectedCats([]);

  const applyCats = () => {
    setSearchParams({
      page: 1,
      search,
      level,
      status,
      sort,
      ...(selectedCats.length ? { category: selectedCats.join(",") } : {}),
    });
    setCatOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = () => {
    setSearchParams({
      page: 1,
      search: searchTerm,
      level,
      status,
      category,
      sort,
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchParams({
      page: 1,
      level,
      status,
      category,
      sort,
    });
  };

  const toggleSort = () => {
    setSearchParams({
      page: 1,
      search,
      level,
      status,
      category,
      sort: sort === "desc" ? "asc" : "desc",
    });
  };

  const totalPages = Math.ceil(totalCount / 20);
  const sortText =
    sort === "desc" ? "정답률이 높은 문제" : "정답률이 낮은 문제";

  return (
    <div className="p-4 bg-[#F9FAFB] min-h-screen">
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-xl border border-gray-200 p-6 mt-6">
        {/* 페이지 헤더 */}
        <div className="mb-6">
          {/* 타이틀 + 우측 언어 배지 */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <FileCode className="w-8 h-8 text-green-600" />
              <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">
                코딩 테스트
              </h1>
            </div>

            {/* 지원 언어 배지 (md↑에서만 노출) */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs text-gray-500">지원 언어</span>

              {/* Python */}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700">
                <Code className="w-3.5 h-3.5 text-sky-600" />
                PYTHON
              </span>

              {/* Java */}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold text-orange-700">
                <Coffee className="w-3.5 h-3.5 text-orange-600" />
                JAVA
              </span>

              {/* JavaScript */}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                <Braces className="w-3.5 h-3.5 text-amber-700" />
                JAVASCRIPT
              </span>
            </div>
          </div>

          {/* 간단 설명 */}
          <p className="text-sm text-gray-500 leading-relaxed">
            문제를 풀며{" "}
            <span className="text-green-600 font-medium">알고리즘 사고력</span>
            을 키워보세요.
          </p>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex flex-col gap-3 mb-6">
          {/* 검색창 */}
          <div
            className={`flex items-center border rounded-lg w-full max-w-xl px-3 py-2 bg-white/70 backdrop-blur ${
              search
                ? "border-green-500"
                : "border-gray-300 hover:border-green-400 focus-within:border-green-400"
            }`}
          >
            <input
              type="text"
              placeholder="문제 제목 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full bg-transparent outline-none text-sm"
            />
            {searchTerm && (
              <X
                className="w-4 h-4 text-gray-400 cursor-pointer mx-2 hover:text-gray-600"
                onClick={clearSearch}
              />
            )}
            <Search
              className="w-4 h-4 text-gray-500 cursor-pointer"
              onClick={handleSearch}
            />
          </div>

          {/* 필터 박스 */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
            <div className="flex flex-wrap items-end gap-3">
              {/* 선호 언어 */}
              {user && (
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-gray-500">선호 언어</span>
                  <select
                    value={preferredLang}
                    onChange={handlePreferredLangChange}
                    className="h-9 w-[180px] min-w-[180px] shrink-0 border border-gray-300 rounded-md px-3 pr-8 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
                    title="코딩테스트 기본 언어 설정"
                  >
                    <option value="">선호 언어 선택</option>
                    {LANG_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 난이도 */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-gray-500">난이도</span>
                <select
                  value={level}
                  onChange={(e) =>
                    setSearchParams({
                      page: 1,
                      search,
                      status,
                      category,
                      sort,
                      level: e.target.value,
                    })
                  }
                  className="h-9 border border-gray-300 rounded-md px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-300 w-[120px]"
                >
                  <option value="">전체</option>
                  {[1, 2, 3, 4, 5].map((lv) => (
                    <option key={lv} value={lv}>
                      Lv.{lv}
                    </option>
                  ))}
                </select>
              </div>

              {/* 카테고리 (다중선택 패널 트리거) */}
              <div className="flex flex-col gap-1 relative" ref={catPanelRef}>
                <span className="text-[11px] text-gray-500">카테고리</span>
                <button
                  type="button"
                  onClick={() => setCatOpen((v) => !v)}
                  className="h-9 flex items-center gap-2 border border-gray-300 rounded-md px-3 text-sm bg-white hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-300"
                  title="카테고리 다중 선택"
                >
                  <span>선택하기</span>
                  {selectedCats.length > 0 && (
                    <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">
                      {selectedCats.length}
                    </span>
                  )}
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {catOpen && (
                  // 🔽 팝오버: 버튼 컨테이너 기준으로 '겹쳐' 뜨도록 left-0 + top-full + mt-2
                  <div className="absolute left-0 top-full mt-2 z-50 w-[28rem] max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white shadow-2xl p-4">
                    <div className="mb-3">
                      <div className="text-sm font-semibold text-gray-800">
                        카테고리
                      </div>
                      <div className="text-xs text-gray-500">
                        중복 선택할 수 있어요
                      </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto pr-1">
                      <div className="flex flex-wrap gap-2">
                        {categoryCounts.map((cat) => {
                          const active = selectedCats.includes(cat.category);
                          return (
                            <button
                              key={cat.category}
                              type="button"
                              onClick={() => toggleCat(cat.category)}
                              className={[
                                "inline-flex items-center rounded-full border px-2.5 py-1 text-xs transition-colors",
                                active
                                  ? "border-green-300 bg-green-50 text-green-700"
                                  : "border-gray-200 bg-gray-50 text-gray-600 hover:border-green-300",
                              ].join(" ")}
                              title={`${cat.category} (${cat.count})`}
                            >
                              {cat.category}
                              <span className="ml-1 text-[10px] opacity-70">
                                ({cat.count})
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={resetCats}
                        className="text-xs text-gray-500 hover:text-gray-700 underline"
                      >
                        선택 초기화
                      </button>
                      <button
                        type="button"
                        onClick={applyCats}
                        className="h-9 rounded-md bg-green-600 px-4 text-sm text-white hover:bg-green-700"
                      >
                        적용하기
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 상태 */}
              {user && (
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-gray-500">상태</span>
                  <select
                    value={status}
                    onChange={(e) =>
                      setSearchParams({
                        page: 1,
                        search,
                        level,
                        category,
                        sort,
                        status: e.target.value,
                      })
                    }
                    className="h-9 border border-gray-300 rounded-md px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-300 w-[120px]"
                  >
                    <option value="">전체</option>
                    <option value="solved">푼 문제</option>
                    <option value="unsolved">안 푼 문제</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* ✅ 선택된 카테고리 칩 (적용하기 이후에만 노출) */}
          <div
            className={`transition-all duration-300 overflow-hidden ${
              committedCats.length
                ? "max-h-24 mt-1 opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-green-100 bg-green-50/50 px-3 py-2">
              <button
                type="button"
                onClick={clearCommittedCats}
                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                title="선택 초기화"
              >
                <RefreshCw className="w-3 h-3" />
                초기화
              </button>

              {committedCats.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center rounded-full border border-green-200 bg-white text-green-700 px-2.5 py-1 text-xs shadow-sm"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => removeCommittedCat(c)}
                    className="ml-1 hover:text-green-900"
                    aria-label={`${c} 제거`}
                    title="제거"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 문제 목록 헤더 라인 */}
        <div className="flex justify-between items-center mb-4">
          {/* 좌측: 아이콘 + 제목 + 총 문제 수 */}
          <div className="flex items-center gap-2 text-gray-800">
            <ListChecks className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">
              문제 목록{" "}
              <span className="text-sm font-normal text-gray-500">
                · 총 <strong>{totalCount}</strong> 문제
              </span>
            </h2>
          </div>

          {/* 우측: 정렬 버튼 */}
          <button
            onClick={toggleSort}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
          >
            {sortText} <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>

        {/* 문제 목록 테이블 */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm text-gray-700 border-collapse">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="p-3 w-[50px] text-center">상태</th>
                <th className="p-3 w-[60px] text-center">번호</th>
                <th className="p-3 text-left">제목</th>
                <th className="p-3 w-[100px] text-center">난이도</th>
                <th className="p-3 w-[160px] text-center">카테고리</th>
                <th className="p-3 w-[100px] text-center">정답률</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((problem) => (
                <tr
                  key={problem.id}
                  className="hover:bg-gray-50 border-b border-gray-100 cursor-pointer"
                >
                  <td className="p-3 text-center">
                    {user && problem.solved && (
                      <Check className="w-4 h-4 text-blue-500 mx-auto" />
                    )}
                  </td>

                  <td className="p-3 text-center">{problem.id}</td>
                  <td className="p-3 text-left">
                    <Link
                      to={`/codingtest/${problem.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {problem.title}
                    </Link>
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium inline-block ${getLevelClass(
                        problem.level
                      )}`}
                    >
                      Lv.{problem.level}
                    </span>
                  </td>
                  <td className="p-3 text-center">{problem.category || "-"}</td>
                  <td className="p-3 text-center">
                    {(parseFloat(problem.correct_rate) || 0).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => {
                setSearchParams({
                  page: i + 1,
                  search,
                  level,
                  status,
                  category,
                  sort,
                });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`px-3 py-1.5 rounded-md border text-sm ${
                page === i + 1
                  ? "bg-green-600 text-white"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CodingTestPage;
