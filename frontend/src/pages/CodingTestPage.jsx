import React, { useEffect, useState } from "react";
import { FaCheck, FaSort, FaSearch, FaTimes } from "react-icons/fa";
import { useSearchParams, Link } from "react-router-dom";
import { getCodingTestList } from "../api/codingTestApi";
import { useAuth } from "../context/AuthContext";
import { BookOpenText } from "lucide-react";

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
    <div className="p-6 bg-white min-h-screen">
      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-2xl border border-gray-300 p-7">
        {/* 페이지 타이틀 */}
        <div className="mb-4">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-4 tracking-wide">
            코딩 테스트
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            다양한 문제를 풀며{" "}
            <span className="font-medium text-gray-700">알고리즘 사고력</span>을
            키우고, 실력을 단계별로 쌓아보세요.
          </p>
        </div>

        {/* 문제 목록 타이틀 (아이콘 + 구분선) */}
        <div className="flex items-center gap-2 mb-4">
          <BookOpenText className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-800">문제 목록</h2>
        </div>

        {/* 문제 검색 및 필터링 설명 */}
        <p className="text-sm text-gray-600 mb-2 ml-[2px]">
          원하는 문제를 검색하거나 조건별로 필터링해보세요.
        </p>

        {/* 검색 & 필터 */}
        <div className="flex flex-col gap-2 mb-6">
          <div
            className={`flex items-center border rounded-md w-[500px] bg-white px-2 ${
              search
                ? "border-green-500"
                : "border-gray-300 hover:border-green-500 focus-within:border-green-500"
            }`}
          >
            <input
              type="text"
              placeholder="풀고 싶은 문제 제목 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="px-2 py-2 w-full outline-none bg-white"
            />
            {searchTerm && (
              <FaTimes
                className="text-gray-400 cursor-pointer mx-2"
                onClick={clearSearch}
              />
            )}
            <FaSearch
              className="text-gray-500 cursor-pointer"
              onClick={handleSearch}
            />
          </div>

          {/* 필터 순서: 난이도 → 카테고리 → 상태 */}
          <div className="flex gap-2 mt-2">
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
              className="border border-gray-300 rounded-md px-2 py-1 w-[100px]"
            >
              <option value="">난이도</option>
              <option value="1">Lv.1</option>
              <option value="2">Lv.2</option>
              <option value="3">Lv.3</option>
              <option value="4">Lv.4</option>
              <option value="5">Lv.5</option>
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
              className="border border-gray-300 rounded-md px-2 py-1 w-[180px]"
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
                className="border border-gray-300 rounded-md px-2 py-1 w-[100px]"
              >
                <option value="">상태</option>
                <option value="solved">푼 문제</option>
                <option value="unsolved">안 푼 문제</option>
              </select>
            )}
          </div>
        </div>

        {/* 문제 수 + 정렬 */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-black">
            총 <strong>{totalCount}</strong> 문제
          </span>
          <button
            onClick={toggleSort}
            className="flex items-center text-sm text-gray-600 hover:text-gray-800"
          >
            {sortText} <FaSort className="ml-1" />
          </button>
        </div>

        {/* 문제 목록 */}
        <div className="max-w-6xl mx-auto bg-white shadow rounded-lg overflow-hidden border border-gray-300">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="border-b border-gray-300 bg-white text-gray-700 text-sm">
                <th className="p-3 font-medium w-[50px] text-center">상태</th>
                <th className="p-3 font-medium w-[60px] text-center">번호</th>
                <th className="p-3 font-medium w-[300px] text-left">제목</th>
                <th className="p-3 font-medium w-[100px] text-center">
                  난이도
                </th>
                <th className="p-3 font-medium w-[160px] text-center">
                  카테고리
                </th>
                <th className="p-3 font-medium w-[100px] text-center">
                  정답률
                </th>
              </tr>
            </thead>
            <tbody>
              {problems.map((problem) => (
                <tr
                  key={problem.id}
                  className="hover:bg-gray-50 border-b border-gray-200 cursor-pointer text-sm"
                >
                  <td className="p-3 w-[50px] text-center pr-2">
                    {user && problem.solved && (
                      <FaCheck className="text-blue-500 mx-auto" />
                    )}
                  </td>
                  <td className="p-3 w-[60px] text-center">{problem.id}</td>
                  <td className="p-3 w-[300px] text-left">
                    <Link
                      to={`/codingtest/${problem.id}`}
                      className="hover:underline text-blue-600"
                    >
                      {problem.title}
                    </Link>
                  </td>
                  <td className="p-3 w-[100px] text-center">
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold inline-block ${getLevelClass(
                        problem.level
                      )}`}
                    >
                      Lv.{problem.level}
                    </span>
                  </td>
                  <td className="p-3 w-[160px] text-center">
                    {problem.category || "-"}
                  </td>
                  <td className="p-3 w-[100px] text-center">
                    {(parseFloat(problem.correct_rate) || 0).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="flex justify-center mt-4 gap-2">
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
              className={`px-3 py-1 rounded-md border ${
                page === i + 1 ? "bg-green-600 text-white" : "hover:bg-gray-200"
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
