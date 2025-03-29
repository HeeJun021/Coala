import React, { useEffect, useState } from "react";
import { FaCheck, FaSort, FaSearch, FaTimes } from "react-icons/fa";
import { useSearchParams, Link } from "react-router-dom";

const levelColors = {
    1: "text-blue-500",
    2: "text-green-500",
    3: "text-yellow-500",
    4: "text-orange-500",
    5: "text-red-500",
};

const CodingTestPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [problems, setProblems] = useState([]);
    const [totalCount, setTotalCount] = useState(0);

    // 쿼리 상태
    const page = parseInt(searchParams.get("page")) || 1;
    const search = searchParams.get("search") || "";
    const level = searchParams.get("level") || "";
    const status = searchParams.get("status") || "";
    const sort = searchParams.get("sort") || "desc";

    const [searchTerm, setSearchTerm] = useState(search);

    useEffect(() => {
        const dummy = Array.from({ length: 200 }, (_, i) => ({
            id: 200 - i,
            title: `문제 ${200 - i}`,
            level: (i % 5) + 1,
            attempts: Math.floor(Math.random() * 1000),
            accuracy: Math.floor(Math.random() * 100),
            solved: i % 2 === 0,
        }));

        let result = [...dummy];

        if (search) {
            result = result.filter((item) =>
                item.title.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (level) {
            result = result.filter((item) => item.level === parseInt(level));
        }

        if (status) {
            if (status === "solved") result = result.filter((item) => item.solved === true);
            else if (status === "unsolved") result = result.filter((item) => item.solved === false);
        }

        if (sort === "desc") {
            result.sort((a, b) => b.accuracy - a.accuracy);
        } else if (sort === "asc") {
            result.sort((a, b) => a.accuracy - b.accuracy);
        }

        setTotalCount(result.length);

        const start = (page - 1) * 20;
        const end = start + 20;
        setProblems(result.slice(start, end));
    }, [page, search, level, status, sort]);

    const handleSearch = () => {
        setSearchParams({
            page: 1,
            search: searchTerm,
            level,
            status,
            sort,
        });
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    const clearSearch = () => {
        setSearchTerm("");
        setSearchParams({
            page: 1,
            level,
            status,
            sort,
        });
    };

    const toggleSort = () => {
        setSearchParams({
            page: 1,
            search,
            level,
            status,
            sort: sort === "desc" ? "asc" : "desc",
        });
    };

    const totalPages = Math.ceil(totalCount / 20);
    const sortText = sort === "desc" ? "정답률이 높은 문제" : "정답률이 낮은 문제";

    return (
        <div className="p-6 pt-[90px] bg-white min-h-screen">
            {/* 검색 & 필터 */}
            <div className="flex flex-col gap-2 mb-4">
                <div
                    className={`flex items-center border rounded-md w-[500px] bg-white px-2 ${
                        searchTerm
                            ? "border-blue-500"
                            : "border-gray-300 hover:border-blue-400 focus-within:border-blue-500"
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

                <div className="flex gap-2">
                    <select
                        value={status}
                        onChange={(e) =>
                            setSearchParams({
                                page: 1,
                                search,
                                level,
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
                    <select
                        value={level}
                        onChange={(e) =>
                            setSearchParams({
                                page: 1,
                                search,
                                status,
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
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-300">
                <table className="w-full text-center border-collapse">
                    <thead>
                        <tr className="border-b border-gray-300 bg-white text-gray-700 text-sm">
                            <th className="p-3 font-medium w-[50px] text-center">상태</th>
                            <th className="p-3 font-medium w-[60px] text-center">번호</th>
                            <th className="p-3 font-medium w-[300px] text-left">제목</th>
                            <th className="p-3 font-medium w-[100px] text-center">난이도</th>
                            <th className="p-3 font-medium w-[120px] text-center">완료한 사람</th>
                            <th className="p-3 font-medium w-[80px] text-center">정답률</th>
                        </tr>
                    </thead>
                    <tbody>
                        {problems.map((problem) => (
                            <tr
                                key={problem.id}
                                className="hover:bg-gray-50 border-b border-gray-200 cursor-pointer text-sm"
                            >
                                <td className="p-3 w-[50px] text-center pr-2">
                                    {problem.solved && (
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
                                <td
                                    className={`p-3 font-semibold w-[100px] text-center ${levelColors[problem.level]}`}
                                >
                                    Lv.{problem.level}
                                </td>
                                <td className="p-3 w-[120px] text-center">{problem.attempts}명</td>
                                <td className="p-3 w-[80px] text-center">{problem.accuracy}%</td>
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
                        onClick={() =>
                            setSearchParams({
                                page: i + 1,
                                search,
                                level,
                                status,
                                sort,
                            })
                        }
                        className={`px-3 py-1 rounded-md border ${
                            page === i + 1 ? "bg-gray-300" : "hover:bg-gray-200"
                        }`}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CodingTestPage;
