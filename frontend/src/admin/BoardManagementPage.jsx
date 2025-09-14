// frontend/src/admin/BoardManagementPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAdminPosts, deleteAdminPost } from "../api/adminApi";
import { MoreVertical } from "lucide-react";

const BOARD_TYPES = [
  { key: "free", label: "자유게시판" },
  { key: "code", label: "코드게시판" },
  { key: "project", label: "프로젝트 게시판" },
];

const BoardManagementPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [boardType, setBoardType] = useState("free");
  const [menuOpen, setMenuOpen] = useState(null); // 더보기 메뉴 열림 상태
  const navigate = useNavigate();

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminPosts(boardType);
      setPosts(data);
    } catch (err) {
      console.error("게시글 목록 불러오기 실패:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [boardType]);

  const handleDeletePost = async (postId) => {
    if (!window.confirm("정말 이 게시글을 삭제하시겠습니까?")) return;
    try {
      await deleteAdminPost(postId);
      alert("게시글이 삭제되었습니다.");
      loadPosts();
    } catch (err) {
      console.error("게시글 삭제 실패:", err);
      alert("삭제 실패");
    }
  };

  if (loading) return <div className="p-6">로딩 중...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">📋 게시판 관리</h1>

      {/* 게시판 타입 선택 */}
      <div className="mb-4 flex gap-2">
        {BOARD_TYPES.map((bt) => (
          <button
            key={bt.key}
            onClick={() => setBoardType(bt.key)}
            className={`px-4 py-2 rounded ${
              boardType === bt.key
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {bt.label}
          </button>
        ))}
      </div>

      {/* 게시글 목록 */}
      {posts.length === 0 ? (
        <p className="text-gray-500">게시글이 없습니다.</p>
      ) : (
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">ID</th>
              <th className="border p-2">제목</th>
              <th className="border p-2">작성자</th>
              <th className="border p-2">작성일</th>
              <th className="border p-2">관리</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.post_id} className="hover:bg-gray-50">
                <td className="border p-2">{post.post_id}</td>
                <td
                  className="border p-2 cursor-pointer"
                  onClick={() => navigate(`/admin/posts/${post.post_id}`)}
                >
                  {post.title}
                </td>
                <td className="border p-2">
                  {post.author_nickname || "알 수 없음"}
                </td>
                <td className="border p-2">
                  {new Date(post.created_at).toLocaleString()}
                </td>
                <td className="border p-2 relative">
                  {/* 더보기 버튼 */}
                  <button
                    onClick={() =>
                      setMenuOpen(menuOpen === post.post_id ? null : post.post_id)
                    }
                    className="p-1 rounded hover:bg-gray-200"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {/* 드롭다운 메뉴 */}
                  {menuOpen === post.post_id && (
                    <div className="absolute right-0 mt-2 w-28 bg-white border rounded shadow-md z-10">
                      <button
                        onClick={() => navigate(`/admin/posts/${post.post_id}`)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.post_id)}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BoardManagementPage;
