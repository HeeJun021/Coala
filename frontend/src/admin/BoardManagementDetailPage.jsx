import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBoardDetail } from "../api/boardApi";
import { getComments } from "../api/commentApi";
import { deleteAdminComment, deleteAdminPost } from "../api/adminApi";

const BoardManagementDetailPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const postData = await getBoardDetail(postId);
      const commentData = await getComments(postId);
      setPost(postData);
      setComments(commentData);
    } catch (error) {
      console.error("데이터 불러오기 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [postId]);

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("이 댓글을 삭제하시겠습니까?")) {
      try {
        await deleteAdminComment(commentId);
        setComments((prev) =>
          prev.map((c) =>
            c.comment_id === commentId
              ? { ...c, content: "삭제된 댓글입니다." }
              : c
          )
        );
      } catch (err) {
        console.error("댓글 삭제 실패:", err);
        alert("댓글 삭제에 실패했습니다.");
      }
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm("이 게시글을 삭제하시겠습니까?")) {
      try {
        await deleteAdminPost(postId);
        alert("게시글이 삭제되었습니다.");
        navigate("/admin/board", { replace: true });
      } catch (err) {
        console.error("게시글 삭제 실패:", err);
        alert("게시글 삭제에 실패했습니다.");
      }
    }
  };

  if (loading) return <div className="p-6">로딩 중...</div>;
  if (!post) return <div className="p-6 text-red-500">게시글을 찾을 수 없습니다.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">📝 게시글 상세</h1>
        <button onClick={handleDeletePost} className="text-sm text-red-500 hover:underline">
          삭제
        </button>
      </div>

      <div className="bg-white shadow p-4 rounded">
        <h2 className="text-xl font-semibold mb-1">{post.title}</h2>
        <p className="text-sm text-gray-500 mb-2">
          작성자: {post.author_nickname} | 게시판: {post.board_type} | 작성일: {new Date(post.created_at).toLocaleString()}
        </p>
        <p className="whitespace-pre-line text-gray-800">{post.content}</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">💬 댓글 목록</h3>
        {comments.length === 0 ? (
          <p className="text-gray-500">댓글이 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li
                key={comment.comment_id}
                className="bg-white border p-3 rounded flex justify-between items-start"
              >
                <div>
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {comment.content}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    작성자: {comment.user?.nickname || "알 수 없음"} | 작성일: {new Date(comment.created_at).toLocaleString()}
                  </p>
                </div>
                {comment.content !== "삭제된 댓글입니다." && (
                  <button
                    onClick={() => handleDeleteComment(comment.comment_id)}
                    className="text-sm text-red-500 hover:underline"
                  >
                    삭제
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default BoardManagementDetailPage;
