import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import CommentEditor from "../components/CommentEditor";

const BoardDetailPage = () => {
  const { boardType, postId } = useParams();
  const navigate = useNavigate();

  const handleCommentSubmit = (content) => {
    console.log("댓글 내용:", content);
    // ✨ 추후 API 연결 시 여기에 POST 요청
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen">
      <h2 className="text-2xl font-semibold mb-4">게시글 상세</h2>

      {/* 게시글 내용 영역 */}
      <div className="border p-4 mb-8">
        <h3 className="text-xl font-bold mb-2">게시글 제목 (ID: {postId})</h3>
        <p>여기에 게시글 내용 표시</p>
      </div>

      {/* 댓글 작성 영역 */}
      <h3 className="text-lg font-semibold mb-2">댓글 작성</h3>

      {boardType === "code" ? (
        <CommentEditor onSubmit={handleCommentSubmit} />
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const content = e.target.comment.value;
            if (!content.trim()) return alert("댓글 내용을 입력하세요.");
            handleCommentSubmit(content);
            e.target.comment.value = "";
          }}
          className="mt-4"
        >
          <textarea
            name="comment"
            placeholder="댓글을 입력하세요"
            className="w-full border p-2 h-24"
          />
          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded-md"
            >
              댓글 등록
            </button>
          </div>
        </form>
      )}

      {/* 댓글 목록 (나중에 구현 예정) */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">댓글 목록</h3>
        <p>댓글 목록 표시 영역</p>
      </div>
    </div>
  );
};

export default BoardDetailPage;
