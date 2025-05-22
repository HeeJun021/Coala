import React, { useEffect, useState } from "react";
import { fetchAdminPosts, deleteAdminPost } from "../api/adminApi";
import { getBoardDetail } from "../api/boardApi";
import { useNavigate } from "react-router-dom";

const BOARD_TYPES = [
  { label: "자유 게시판", value: "free" },
  { label: "코드 게시판", value: "code" },
  { label: "프로젝트 게시판", value: "project" },
];

const BoardManagementPage = () => {
  const [boardType, setBoardType] = useState("free");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminPosts(boardType);
      setPosts(data);
    } catch (err) {
      console.error("게시글을 불러오지 못했습니다:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [boardType]);

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

  const handleDetail = (postId) => {
    navigate(`/admin/posts/${postId}`); // 관리자용 상세 페이지 경로로 이동
  };

  return (
    <div className="px-6 py-6 space-y-6">
      <h1 className="text-2xl font-bold">📋 게시글 관리</h1>

      <div className="flex gap-4">
        {BOARD_TYPES.map((item) => (
          <button
            key={item.value}
            onClick={() => setBoardType(item.value)}
            className={`px-4 py-2 rounded border ${
              boardType === item.value ? "bg-blue-600 text-white" : "bg-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p>로딩 중...</p>
      ) : posts.length === 0 ? (
        <p className="text-gray-500">게시글이 없습니다.</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li
              key={post.post_id}
              className="p-4 bg-white rounded shadow flex justify-between items-start"
            >
              <div className="cursor-pointer" onClick={() => handleDetail(post.post_id)}>
                <p className="font-semibold">{post.title}</p>
                <p className="text-sm text-gray-500">
                  작성자: {post.author_nickname} | 댓글: {post.comment_count} | 좋아요: {post.like_count}
                </p>
              </div>
              <button
                onClick={() => handleDelete(post.post_id)}
                className="text-sm text-red-500 hover:underline"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BoardManagementPage;
