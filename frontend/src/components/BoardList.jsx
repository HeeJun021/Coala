import React, { useEffect, useState } from "react";
import BoardItem from "./BoardItem";
import BoardSearchBar from "./BoardSearchBar";
import BoardSortDropdown from "./BoardSortDropdown";
import Pagination from "./Pagination";
import { BOARD_TYPES } from "../constants/boardConstants";

const BoardList = ({ boardType }) => {
  const [posts, setPosts] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortOrder, setSortOrder] = useState("최신 순");

  useEffect(() => {
    // TODO: API 연결 시 fetchPosts 함수 구현 예정
    setPosts([]); // 더미 데이터 제거
  }, [boardType]);

  const filteredPosts = Array.isArray(posts)
    ? posts.filter((post) => post.title.includes(searchKeyword))
    : [];

  return (
    <div>
      {/* 게시판 이름 */}
      <h2 className="text-xl font-semibold mb-4 capitalize">
        {boardType === BOARD_TYPES.PROJECT
          ? "프로젝트 게시판"
          : boardType === BOARD_TYPES.FREE
          ? "자유게시판"
          : "코드 공유 게시판"}
      </h2>

      {/* 검색 + 정렬 */}
      <div className="flex items-center mb-4">
        <BoardSearchBar
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
        <BoardSortDropdown value={sortOrder} onChange={setSortOrder} />
      </div>

      {/* 게시글 테이블 */}
      <table className="w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 w-16">게시일</th>
            <th className="border p-2">제목</th>
            <th className="border p-2 w-24">사진첨부</th>
            {boardType === BOARD_TYPES.PROJECT ? (
              <th className="border p-2 w-24">모집인원</th>
            ) : (
              <th className="border p-2 w-20">댓글</th>
            )}
            <th className="border p-2 w-20">좋아요</th>
          </tr>
        </thead>
        <tbody>
          {filteredPosts.map((post) => (
            <BoardItem key={post.id} post={post} boardType={boardType} />
          ))}
        </tbody>
      </table>

      {/* 페이지네이션 */}
      <Pagination totalPages={5} currentPage={1} />
    </div>
  );
};

export default BoardList;
