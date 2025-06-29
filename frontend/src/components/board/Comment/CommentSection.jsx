import React, { useState } from "react";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";

const CommentSection = () => {
  const [comments, setComments] = useState([
    {
      id: 1,
      writer: "홍길동",
      content: "좋은 글입니다!",
      replies: [
        { id: 3, writer: "이영희", content: "저도 동의합니다!", replies: [] },
      ],
    },
    {
      id: 2,
      writer: "김철수",
      content: "감사합니다.",
      replies: [],
    },
  ]);

  // 댓글 작성
  const addComment = (content) => {
    const newComment = {
      id: Date.now(),
      writer: "현재 사용자",
      content,
      replies: [],
    };
    setComments([...comments, newComment]);
  };

  // 대댓글 작성
  const addReply = (parentId, replyContent) => {
    const updated = comments.map((comment) => {
      if (comment.id === parentId) {
        const newReply = {
          id: Date.now(),
          writer: "현재 사용자",
          content: replyContent,
          replies: [],
        };
        return { ...comment, replies: [...comment.replies, newReply] };
      }
      return comment;
    });
    setComments(updated);
  };

  // 댓글 수정
  const editComment = (commentId, newContent) => {
    const update = (items) =>
      items.map((item) =>
        item.id === commentId
          ? { ...item, content: newContent }
          : { ...item, replies: update(item.replies) }
      );
    setComments(update(comments));
  };

  // 댓글 삭제
  const deleteComment = (commentId) => {
    const remove = (items) =>
      items
        .filter((item) => item.id !== commentId)
        .map((item) => ({ ...item, replies: remove(item.replies) }));
    setComments(remove(comments));
  };

  // 신고
  const reportComment = (commentId) => {
    alert(`댓글 ${commentId} 신고 처리`);
  };

  return (
    <div className="mt-8">
      <h4 className="font-semibold mb-2">댓글</h4>
      {/* 댓글 작성 */}
      <CommentForm onSubmit={addComment} />

      {/* 댓글 목록 */}
      <ul className="mt-4 space-y-2">
        {comments.map((comment) => (
          <li key={comment.id}>
            <CommentItem
              comment={comment}
              onReply={addReply}
              onEdit={editComment}
              onDelete={deleteComment}
              onReport={reportComment}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommentSection;
