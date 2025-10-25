// src/pages/mypage/MyPageCommunity.jsx
// ✅ MyPagePortfolioHistory.jsx 디자인 기준으로 완전 통일된 버전

import React, { useState, useEffect, useMemo } from "react";
import {
  History,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getMyPosts, getMyComments } from "../../api/boardApi";

const ITEMS_PER_PAGE = 10;

export default function MyPageCommunity() {
  const { userData } = useOutletContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!userData?.user_id) {
      setErr("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const [postList, commentList] = await Promise.all([
          getMyPosts(userData.user_id),
          getMyComments(userData.user_id),
        ]);
        setPosts(postList || []);
        setComments(commentList || []);
      } catch (e) {
        console.error("❌ 커뮤니티 내역 불러오기 실패:", e);
        setErr("데이터를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userData]);

  const items = useMemo(
    () => (activeTab === "posts" ? posts : comments),
    [activeTab, posts, comments]
  );

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const currentItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, page]);

  useEffect(() => setPage(1), [activeTab]);

  const goPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  const goPost = (item) => {
    const pathMap = {
      free: "free",
      code: "code",
      project: "project",
    };
    const type = pathMap[item.board_type];
    if (!type) return alert("알 수 없는 게시판 유형입니다.");
    navigate(`/board/${type}/${item.post_id}`);
  };

  return (
    <div className="flex min-h-screen">
      {/* 좌측 여백 */}
      <div className="w-[200px]" />

      {/* 메인 콘텐츠 */}
      <div className="flex-1 p-6 max-w-6xl mx-auto">
        <div className="max-w-5xl bg-white shadow-xl rounded-2xl border border-gray-300 p-7 relative ml-4">
          {/* 타이틀 */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-4 tracking-wide">
              커뮤니티 활동 내역
            </h1>
            <p className="text-gray-500 text-sm">
              내가 작성한 게시글과 댓글을 한눈에 확인하세요.
            </p>
          </div>

          {/* 상단 헤더 (아이콘 + 총 개수 + 탭버튼) */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-gray-800">
              <History className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold">
                {activeTab === "posts" ? "내 게시글 목록" : "내 댓글 목록"}{" "}
                <span className="text-sm font-normal text-gray-500">
                  · 총 <strong>{total}</strong>건
                </span>
              </h2>
            </div>

            <div className="flex gap-2">
              <button
                className={`px-5 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === "posts"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-green-100"
                }`}
                onClick={() => setActiveTab("posts")}
              >
                게시글
              </button>
              <button
                className={`px-5 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === "comments"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-green-100"
                }`}
                onClick={() => setActiveTab("comments")}
              >
                댓글
              </button>
            </div>
          </div>

          {/* 데이터 상태 */}
          {loading ? (
            <p className="text-sm text-gray-500">로딩 중...</p>
          ) : err ? (
            <p className="text-sm text-red-500">{err}</p>
          ) : total === 0 ? (
            <p className="text-sm text-gray-500">
              {activeTab === "posts"
                ? "작성한 게시글이 없습니다."
                : "작성한 댓글이 없습니다."}
            </p>
          ) : (
            <>
              {/* 테이블 */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-gray-700 border-collapse">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      {activeTab === "posts" ? (
                        <>
                          <th className="p-3 text-left w-[40%]">제목</th>
                          <th className="p-3 text-center w-[25%]">게시판</th>
                          <th className="p-3 text-center w-[25%]">작성일</th>
                          <th className="p-3 text-center w-[10%]">이동</th>
                        </>
                      ) : (
                        <>
                          <th className="p-3 text-left w-[50%]">댓글 내용</th>
                          <th className="p-3 text-center w-[25%]">게시글 ID</th>
                          <th className="p-3 text-center w-[15%]">작성일</th>
                          <th className="p-3 text-center w-[10%]">이동</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item) =>
                      activeTab === "posts" ? (
                        <tr
                          key={item.post_id}
                          className="hover:bg-gray-50 border-b border-gray-100"
                        >
                          <td className="p-3 text-left truncate font-medium text-gray-800">
                            {item.title}
                          </td>
                          <td className="p-3 text-center">
                            {{
                              free: "자유 게시판",
                              code: "코드 게시판",
                              project: "프로젝트 게시판",
                            }[item.board_type] || "-"}
                          </td>
                          <td className="p-3 text-center text-gray-700">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => goPost(item)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md whitespace-nowrap leading-none"
                            >
                              이동
                            </button>
                          </td>
                        </tr>
                      ) : (
                        <tr
                          key={item.comment_id}
                          className="hover:bg-gray-50 border-b border-gray-100"
                        >
                          <td className="p-3 text-left truncate text-gray-800">
                            {item.content}
                          </td>
                          <td className="p-3 text-center">{item.post_id}</td>
                          <td className="p-3 text-center text-gray-700">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => goPost(item)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md whitespace-nowrap leading-none"
                            >
                              이동
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6 gap-2">
                  <button
                    onClick={() => goPage(page - 1)}
                    className={`px-3 py-2 rounded-md flex items-center justify-center ${
                      page === 1
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                    disabled={page === 1}
                    aria-label="이전 페이지"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => goPage(p)}
                        className={`px-3 py-1.5 rounded-md border text-sm ${
                          page === p
                            ? "bg-green-600 text-white"
                            : "hover:bg-gray-100 text-gray-700"
                        }`}
                        aria-current={page === p ? "page" : undefined}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => goPage(page + 1)}
                    className={`px-3 py-2 rounded-md flex items-center justify-center ${
                      page === totalPages
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                    disabled={page === totalPages}
                    aria-label="다음 페이지"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
