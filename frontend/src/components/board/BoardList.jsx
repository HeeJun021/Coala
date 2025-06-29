import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BoardItem from "./BoardItem";
import BoardSearchBar from "./BoardSearchBar";
import BoardSortDropdown from "./BoardSortDropdown";
import Pagination from "./Pagination";
import { BOARD_TYPES } from "../constants/boardConstants";
import { getBoardList } from "../api/boardApi";

const BoardList = ({ boardType }) => {
  const [posts, setPosts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortOrder, setSortOrder] = useState("최신 순");
  const pageSize = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await getBoardList(boardType, page, sortOrder);
        setPosts(res.posts);
        setTotalCount(res.total);
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

  const getBoardTitle = (type) => {
    switch (type) {
      case BOARD_TYPES.FREE:
        return "자유게시판";
      case BOARD_TYPES.PROJECT:
        return "프로젝트 모집 게시판";
      case BOARD_TYPES.CODE:
        return "코드 공유 게시판";
      default:
        return "게시판";
    }
  };

  return (
    <div className="flex-1 max-w-6xl pt-8 mt-8 mx-auto bg-white shadow-xl rounded-2xl border border-gray-300 p-7">
      {/* 타이틀 */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-4 tracking-wide">
          {getBoardTitle(boardType)}
        </h1>
        <p className="text-gray-500 text-sm">
          다양한 주제의 게시글을 살펴보거나 새로운 글을 작성해보세요.
        </p>
      </div>

      {/* 검색 및 정렬 */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <BoardSearchBar
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
        <BoardSortDropdown value={sortOrder} onChange={setSortOrder} />
      </div>

      {/* 게시글 목록 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 bg-white text-gray-700">
              <th className="p-3 font-medium w-[15%]">게시일</th>
              <th className="p-3 font-medium text-center">제목</th>
              <th className="p-3 font-medium w-[15%]">사진첨부</th>
              {boardType === BOARD_TYPES.PROJECT ? (
                <th className="p-3 font-medium w-[15%]">모집인원</th>
              ) : (
                <th className="p-3 font-medium w-[15%]">댓글</th>
              )}
              <th className="p-3 font-medium w-[15%]">좋아요</th>
            </tr>
          </thead>
          <tbody>
            {filteredPosts.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-6 text-gray-500">
                  해당 게시판에 등록된 게시글이 없습니다.
                </td>
              </tr>
            ) : (
              filteredPosts.map((post) => (
                <BoardItem
                  key={post.post_id}
                  post={post}
                  boardType={boardType}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          <Pagination
            totalPages={totalPages}
            currentPage={page}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* 글 작성하기 버튼 */}
      <div className="flex justify-end mt-6">
        <button
          onClick={() => navigate(`/board/${boardType}/write`)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          글 작성하기
        </button>
      </div>
    </div>
  );
};

export default BoardList;
