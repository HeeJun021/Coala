import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getCodingTestList } from "../api/codingTestApi";
import { useAuth } from "../context/AuthContext";
import {
  ListChecks,
  FileCode,
  Check,
  ArrowUpDown,
  Search,
  X,
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

  const [problems, setProblems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState([]);

  const page = parseInt(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || "";
  const level = searchParams.get("level") || "";
  const status = searchParams.get("status") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "desc";

  const [searchTerm, setSearchTerm] = useState(search);

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
          {/* 코딩 테스트 타이틀 + 아이콘 */}
          <div className="flex items-center gap-2 mb-2">
            <FileCode className="w-8 h-8 text-green-600" />
            <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">
              코딩 테스트
            </h1>
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
            className={`flex items-center border rounded-md w-full max-w-md px-3 py-2 ${
              search
                ? "border-green-500"
                : "border-gray-300 hover:border-green-500 focus-within:border-green-500"
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
                className="w-4 h-4 text-gray-400 cursor-pointer mx-2"
                onClick={clearSearch}
              />
            )}
            <Search
              className="w-4 h-4 text-gray-500 cursor-pointer"
              onClick={handleSearch}
            />
          </div>

          {/* 필터 */}
          <div className="flex flex-wrap gap-2">
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
              className="border border-gray-300 rounded-md px-3 py-1 text-sm w-[100px]"
            >
              <option value="">난이도</option>
              {[1, 2, 3, 4, 5].map((lv) => (
                <option key={lv} value={lv}>
                  Lv.{lv}
                </option>
              ))}
            </select>

            <select
              value={category}
              onChange={(e) =>
                setSearchParams({
                  page: 1,
                  search,
                  status,
                  level,
                  sort,
                  category: e.target.value,
                })
              }
              className="border border-gray-300 rounded-md px-3 py-1 text-sm w-[180px]"
            >
              <option value="">카테고리</option>
              {categoryCounts.map((cat) => (
                <option key={cat.category} value={cat.category}>
                  {cat.category} ({cat.count})
                </option>
              ))}
            </select>

            {user && (
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
                className="border border-gray-300 rounded-md px-3 py-1 text-sm w-[110px]"
              >
                <option value="">상태</option>
                <option value="solved">푼 문제</option>
                <option value="unsolved">안 푼 문제</option>
              </select>
            )}
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
