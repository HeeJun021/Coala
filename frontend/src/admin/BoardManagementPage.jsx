import React, { useEffect, useState } from "react";
import { fetchAdminPosts, deleteAdminPost } from "../api/adminApi";
import { useNavigate } from "react-router-dom";
import { FaEllipsisV } from "react-icons/fa";

const BOARD_TYPES = [
  { label: "자유 게시판", value: "free" },
  { label: "코드 게시판", value: "code" },
  { label: "프로젝트 게시판", value: "project" },
];

const BoardManagementPage = () => {
  const [boardType, setBoardType] = useState("free");
  const [posts, setPosts] = useState([]);
  const [dropdownOpenId, setDropdownOpenId] = useState(null);
  const navigate = useNavigate();

  const loadPosts = async () => {
    try {
      const data = await fetchAdminPosts(boardType);
      setPosts(data);
    } catch (err) {
      console.error("게시글을 불러오지 못했습니다:", err);
    }
  };

  const handleDelete = async (postId) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      try {
        await deleteAdminPost(postId);
        setPosts((prev) => prev.filter((post) => post.post_id !== postId));
      } catch (err) {
        console.error("게시글 삭제 실패:", err);
      }
    }
  };

  useEffect(() => {
    loadPosts();
  }, [boardType]);

  useEffect(() => {
    const handleClickOutside = () => setDropdownOpenId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">📋 게시글 관리</h1>

      {/* 게시판 선택 */}
      <div className="mb-4">
        <select
          value={boardType}
          onChange={(e) => setBoardType(e.target.value)}
          className="px-3 py-1 border rounded"
        >
          {BOARD_TYPES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {/* 게시글 목록 */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full table-auto text-left">
          <thead className="bg-navbar text-white">
            <tr>
              <th className="px-4 py-3">제목</th>
              <th className="px-4 py-3">작성자</th>
              <th className="px-4 py-3">댓글</th>
              <th className="px-4 py-3">좋아요</th>
              <th className="px-4 py-3 text-center">관리</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.post_id} className="border-t hover:bg-gray-50">
                <td
                  className="px-4 py-3 cursor-pointer text-blue-600 hover:underline"
                  onClick={() => navigate(`/admin/posts/${post.post_id}`)}
                >
                  {post.title}
                </td>
                <td className="px-4 py-3">{post.author_nickname}</td>
                <td className="px-4 py-3">{post.comment_count}</td>
                <td className="px-4 py-3">{post.like_count}</td>
                <td className="px-4 py-3 text-center relative">
                  <button
                    className="text-gray-600 hover:text-black"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpenId(dropdownOpenId === post.post_id ? null : post.post_id);
                    }}
                  >
                    <FaEllipsisV />
                  </button>
                  {dropdownOpenId === post.post_id && (
                    <div className="absolute right-6 mt-2 bg-white border rounded shadow-md z-10 w-32">
                      <button
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-red-100 text-red-600"
                        onClick={() => handleDelete(post.post_id)}
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
      </div>

      {/* 게시글 없을 때 */}
      {posts.length === 0 && (
        <p className="text-gray-500 text-center py-6">게시글이 없습니다.</p>
      )}
    </div>
  );
};

export default BoardManagementPage;
