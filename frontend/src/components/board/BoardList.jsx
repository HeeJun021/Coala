import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BoardItem from "./BoardItem";
import BoardSearchBar from "./BoardSearchBar";
import BoardSortDropdown from "./BoardSortDropdown";
import Pagination from "./Pagination";
import { BOARD_TYPES } from "../../constants/boardConstants";
import { getBoardList } from "../../api/boardApi";

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
    // ✅ UserQuiz 레이아웃과 동일: 왼쪽 고정 사이드바 기준 여백
    <div className="w-full min-h-screen pt-4 pl-[164px]">
      {/* ✅ 카드 톤/간격도 UserQuiz 규격으로 통일 */}
      <div className="max-w-7xl mx-auto pt-8 mt-8 bg-white shadow-xl rounded-2xl border border-gray-300 p-7">
        {/* 타이틀: UserQuiz는 3xl이라 거기에 맞춤 */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-4 tracking-wide">
            {getBoardTitle(boardType)}
          </h1>
          <p className="text-gray-500 text-sm">
            다양한 주제의 게시글을 살펴보거나 새로운 글을 작성해보세요.
          </p>
        </div>

        {/* 검색 & 정렬 - 간격 유지 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <div className="w-full sm:w-auto">
            {/* ✅ 검색바 500px 고정폭 + 초기화 지원(onClear) */}
            <BoardSearchBar
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onSearch={() => { /* 클라이언트 필터이므로 별도 액션 없음 */ }}
              onClear={() => setSearchKeyword("")}
              placeholder="게시글 제목 검색"
              widthClass="w-[500px]"
            />
          </div>
          <BoardSortDropdown value={sortOrder} onChange={setSortOrder} />
        </div>

        {/* 테이블: UserQuiz 표 톤과 동일 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-700 border-collapse">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="p-3 font-medium w-[15%] text-center">게시일</th>
                <th className="p-3 font-medium text-left">제목</th>
                <th className="p-3 font-medium w-[15%] text-center">사진첨부</th>
                {boardType === BOARD_TYPES.PROJECT ? (
                  <th className="p-3 font-medium w-[15%] text-center">모집인원</th>
                ) : (
                  <th className="p-3 font-medium w-[15%] text-center">댓글</th>
                )}
                <th className="p-3 font-medium w-[15%] text-center">좋아요</th>
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
                  <BoardItem key={post.post_id} post={post} boardType={boardType} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션: UserQuiz 톤 */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            <Pagination
              totalPages={totalPages}
              currentPage={page}
              onPageChange={setPage}
            />
          </div>
        )}

        {/* 글 작성하기: UserQuiz 버튼 톤 */}
        <div className="flex justify-end mt-6">
          <button
            onClick={() => navigate(`/board/${boardType}/write`)}
            className="px-6 py-2 bg-green-600 text-white rounded-xl shadow-md hover:bg-green-700 transition-all"
          >
            글 작성하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoardList;
