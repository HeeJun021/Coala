import React, { useEffect, useState } from "react";
import BoardItem from "./BoardItem";
import BoardSearchBar from "./BoardSearchBar";
import BoardSortDropdown from "./BoardSortDropdown";
import Pagination from "./Pagination";
import { BOARD_TYPES } from "../constants/boardConstants";
import { getBoardList } from "../api/boardApi"; // ✅ API 연결

const BoardList = ({ boardType }) => {
  const [posts, setPosts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortOrder, setSortOrder] = useState("최신 순");
  const pageSize = 10;

  // ✅ 게시글 목록 불러오기
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await getBoardList(boardType, page, sortOrder);  // ✅ 페이지와 정렬 전달
        setPosts(res.posts);
        setTotalCount(res.total);                         // ✅ 전체 개수 저장
      } catch (err) {
        console.error("게시글 목록 불러오기 실패:", err);
      }
    };
    fetchPosts();
  }, [boardType, page, sortOrder]);

  const filteredPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <div className="flex items-center mb-4">
        <BoardSearchBar
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
        <BoardSortDropdown value={sortOrder} onChange={setSortOrder} />
      </div>

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
          {filteredPosts.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center p-4">
                게시글이 없습니다.
              </td>
            </tr>
          ) : (
            filteredPosts.map((post) => (
              <BoardItem key={post.post_id} post={post} boardType={boardType} />
            ))
          )}
        </tbody>
      </table>

      <Pagination totalPages={totalPages} currentPage={page} onPageChange={setPage} />
    </div>
  );
};

export default BoardList;