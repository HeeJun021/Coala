import React, { useState } from "react";
import CommentForm from "./CommentForm";
import UserNameWithProfile from "../UserNameWithProfile"; // ✅ 경로는 실제 위치에 맞게 조정하세요

const CommentItem = ({ comment, onReply, onEdit, onDelete, onReport }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="mb-2">
      {/* 댓글 내용 */}
      {!isEditing ? (
        <div className="flex justify-between items-center bg-white p-2 rounded-md">
          <div>
            <UserNameWithProfile
              userId={comment.user_id}
              nickname={comment.nickname || "작성자"} // ✅ 댓글 작성자 표시
            />
            {comment.content}
          </div>
          <div className="space-x-2 text-sm text-gray-500">
            <button onClick={() => setIsReplying(!isReplying)}>답글</button>
            <button onClick={() => setIsEditing(true)}>수정</button>
            <button onClick={() => onDelete(comment.id)}>삭제</button>
            <button onClick={() => onReport(comment.id)}>신고</button>
          </div>
        </div>
      ) : (
        <CommentForm
          initialValue={comment.content}
          onSubmit={(newContent) => {
            onEdit(comment.id, newContent);
            setIsEditing(false);
          }}
        />
      )}

      {/* 대댓글 입력창 */}
      {isReplying && (
        <div className="ml-6 mt-2">
          <CommentForm
            placeholder="답글을 입력하세요"
            onSubmit={(replyContent) => {
              onReply(comment.id, replyContent);
              setIsReplying(false);
            }}
          />
        </div>
      )}

      {/* 대댓글 목록 */}
      {comment.replies &&
        comment.replies.map((reply) => (
          <div key={reply.id} className="ml-6 mt-2">
            <CommentItem
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReport={onReport}
            />
          </div>
        ))}
    </div>
  );
};

export default CommentItem;
