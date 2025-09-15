// frontend/src/admin/BoardManagementDetailPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchAdminPostById,
  fetchAdminComments,
  deleteAdminComment,
  deleteAdminPost,
  fetchAdminUserDetail,
} from "../api/adminApi";

const BoardManagementDetailPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [author, setAuthor] = useState({ name: "알 수 없음", loading: true });
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  // 작성자 이름 추출
  const extractAuthorName = useCallback((p) => {
    return (
      p?.author_nickname ??
      p?.user?.nickname ??
      p?.author?.nickname ??
      p?.author_name ??
      p?.user?.name ??
      p?.author?.name ??
      null
    );
  }, []);

  // 작성자 ID 추출
  const extractAuthorId = useCallback((p) => {
    return (
      p?.user_id ??
      p?.author_id ??
      p?.writer_id ??
      p?.user?.user_id ??
      p?.author?.user_id ??
      null
    );
  }, []);

  // 게시글 + 댓글 불러오기
  const loadData = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    setAuthor({ name: "알 수 없음", loading: true });

    try {
      const [postData, commentData] = await Promise.all([
        fetchAdminPostById(postId),
        fetchAdminComments(postId),
      ]);

      setPost(postData);
      setComments(commentData);

      // 1차: 응답에서 바로 이름/닉네임 찾기
      const foundName = extractAuthorName(postData);
      if (foundName) {
        setAuthor({ name: foundName, loading: false });
        return;
      }

      // 2차: id가 있으면 사용자 API로 조회
      const uid = extractAuthorId(postData);
      if (uid) {
        try {
          const user = await fetchAdminUserDetail(uid);
          const finalName =
            user?.nickname ?? user?.name ?? user?.display_name ?? "알 수 없음";
          setAuthor({ name: finalName, loading: false });
          return;
        } catch {
          // 조회 실패해도 무시
        }
      }

      // 3차: 모두 실패
      setAuthor({ name: "알 수 없음", loading: false });
    } catch (error) {
      console.error("게시글/댓글 불러오기 실패:", error);
      setAuthor({ name: "알 수 없음", loading: false });
    } finally {
      setLoading(false);
    }
  }, [postId, extractAuthorName, extractAuthorId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("이 댓글을 삭제하시겠습니까?")) return;
    try {
      await deleteAdminComment(commentId);
      setComments((prev) =>
        prev.map((c) =>
          c.comment_id === commentId ? { ...c, content: "삭제된 댓글입니다." } : c
        )
      );
    } catch (err) {
      console.error("댓글 삭제 실패:", err);
      alert("댓글 삭제에 실패했습니다.");
    }
  };

  // 게시글 삭제
  const handleDeletePost = async () => {
    if (!window.confirm("이 게시글을 삭제하시겠습니까?")) return;
    try {
      await deleteAdminPost(postId);
      alert("게시글이 삭제되었습니다.");
      navigate("/admin/board", { replace: true });
    } catch (err) {
      console.error("게시글 삭제 실패:", err);
      alert("게시글 삭제에 실패했습니다.");
    }
  };

  if (loading) return <div className="p-8">로딩 중...</div>;
  if (!post) return <div className="p-8 text-red-600">게시글을 찾을 수 없습니다.</div>;

  return (
    <div className="p-8">
      {/* 게시글 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📝 게시글 상세</h1>
        <button
          onClick={handleDeletePost}
          className="text-sm text-red-500 hover:underline"
        >
          삭제
        </button>
      </div>

      {/* 게시글 본문 */}
      <div className="bg-white shadow p-6 rounded mb-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">{post.title}</h2>
        <p className="text-sm text-gray-500 mb-4">
          작성자: {author.loading ? "불러오는 중..." : author.name} | 게시판:{" "}
          {post.board_type} | 작성일:{" "}
          {new Date(post.created_at).toLocaleString()}
        </p>
        <p className="whitespace-pre-line text-gray-700 leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* 댓글 목록 */}
      <div className="bg-white shadow p-6 rounded">
        <h3 className="text-lg font-semibold mb-4">💬 댓글 목록</h3>
        {comments.length === 0 ? (
          <p className="text-gray-500">댓글이 없습니다.</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((comment) => (
              <li
                key={comment.comment_id}
                className="border p-4 rounded flex justify-between items-start hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm text-gray-800 whitespace-pre-line">
                    {comment.content}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    작성자: {comment.user?.nickname || "알 수 없음"} | 작성일:{" "}
                    {new Date(comment.created_at).toLocaleString()}
                  </p>
                </div>
                {comment.content !== "삭제된 댓글입니다." && (
                  <button
                    onClick={() => handleDeleteComment(comment.comment_id)}
                    className="text-xs text-red-500 hover:underline mt-1"
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
