import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getMyPosts, getMyComments } from "../../api/boardApi";
import {
  CalendarClock,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

const MyPageCommunity = () => {
  const { userData } = useOutletContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("posts");

  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!userData?.user_id) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const fetchData = async () => {
      try {
        const myPosts = await getMyPosts(userData.user_id);
        const myComments = await getMyComments(userData.user_id);
        setPosts(myPosts || []);
        setComments(myComments || []);
      } catch (err) {
        setError("데이터 조회에 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userData]);

  const currentItems = (activeTab === "posts" ? posts : comments).slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.max(
    1,
    Math.ceil((activeTab === "posts" ? posts.length : comments.length) / ITEMS_PER_PAGE)
  );

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  return (
    <div className="flex min-h-screen">
      <div className="w-[250px]"> </div>

      <div className="flex-1 p-6 max-w-6xl mx-auto">
        <h2 className="text-xl font-semibold mt-4 flex items-center gap-2">
          커뮤니티 활동 내역
        </h2>

        <div className="flex gap-2 mb-4 mt-4">
          <button
            className={`px-5 py-2 rounded-lg font-semibold ${
              activeTab === "posts"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-green-700"
            }`}
            onClick={() => setActiveTab("posts")}
          >
            내가 쓴 게시글
          </button>
          <button
            className={`px-5 py-2 rounded-lg font-semibold ${
              activeTab === "comments"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-green-700"
            }`}
            onClick={() => setActiveTab("comments")}
          >
            내가 쓴 댓글
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">로딩 중...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : currentItems.length === 0 ? (
          <p className="text-sm text-gray-500">
            {activeTab === "posts" ? "작성한 게시글이 없습니다." : "작성한 댓글이 없습니다."}
          </p>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-4">
            <table className="w-full border-collapse border text-base">
              <thead>
                <tr className="bg-gray-100 text-sm">
                  {activeTab === "posts" ? (
                    <>
                      <th className="border px-4 py-2 text-center">제목</th>
                      <th className="border px-4 py-2 text-center">게시판</th>
                      <th className="border px-4 py-2 text-center">작성일</th>
                    </>
                  ) : (
                    <>
                      <th className="border px-4 py-2 text-center">댓글 내용</th>
                      <th className="border px-4 py-2 text-center">게시글 ID</th>
                      <th className="border px-4 py-2 text-center">작성일</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item) =>
                  activeTab === "posts" ? (
                    <tr
                      key={item.post_id}
                      className="border text-sm hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        if (["free", "code", "project"].includes(item.board_type)) {
                          navigate(`/board/${item.board_type}/${item.post_id}`);
                        } else {
                          alert("알 수 없는 게시판 유형입니다.");
                        }
                      }}
                    >
                      <td className="px-4 py-2 text-left font-semibold text-blue-700 underline">
                        {item.title}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {{
                          free: "자유 게시판",
                          code: "코드 게시판",
                          project: "프로젝트 모집 게시판",
                        }[item.board_type] || item.board_type}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="inline-flex items-center justify-center gap-1 text-gray-700">
                          <CalendarClock size={16} />
                          {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={item.comment_id} className="border text-sm">
                      <td className="px-4 py-2 text-left">{item.content}</td>
                      <td className="px-4 py-2 text-center">{item.post_id}</td>
                      <td className="px-4 py-2 text-center">
                        <div className="inline-flex items-center justify-center gap-1 text-gray-700">
                          <CalendarClock size={16} />
                          {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center mt-6 space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              className={`px-3 py-2 rounded-lg ${
                currentPage === 1 ? "bg-gray-300 text-gray-600" : "bg-green-600 text-black"
              }`}
              disabled={currentPage === 1}
            >
              ◀
            </button>
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === index + 1
                    ? "bg-accent text-white"
                    : "bg-gray-300 text-gray-700"
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              className={`px-3 py-2 rounded-lg ${
                currentPage === totalPages ? "bg-gray-300 text-gray-600" : "bg-green-600 text-black"
              }`}
              disabled={currentPage === totalPages}
            >
              ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPageCommunity;
