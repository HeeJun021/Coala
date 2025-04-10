// src/pages/CommonBoardDetail.jsx

import React from "react";
import BoardDetailTemplate from "./BoardDetailTemplate";

const CommonBoardDetail = ({
  post,
  user,
  liked,
  likeCount,
  handleLike,
  handleReport,
  isAuthor,
  handleEdit,
  handleDelete,
  handleCommentSubmit,
  parentComments,
  childComments,
  commentLikes,
  handleCommentLike,
  handleCommentEdit,
  handleCommentDelete,
  editingId,
  editContent,
  setEditingId,
  setEditContent,
  replyTargetId,
  setReplyTargetId,
  replyContent,
  setReplyContent,
  handleReplySubmit,
  handleReplyCancel,
  handleCommentReport,
  handleReplyReport,
}) => {
  return (
    <BoardDetailTemplate
      boardName="자유 게시판"
      post={post}
      user={user}
      liked={liked}
      likeCount={likeCount}
      handleLike={handleLike}
      handleReport={handleReport}
      isAuthor={isAuthor}
      handleEdit={handleEdit}
      handleDelete={handleDelete}
      handleCommentSubmit={handleCommentSubmit}
      parentComments={parentComments}
      childComments={childComments}
      commentLikes={commentLikes}
      handleCommentLike={handleCommentLike}
      handleCommentEdit={handleCommentEdit}
      handleCommentDelete={handleCommentDelete}
      editingId={editingId}
      editContent={editContent}
      setEditingId={setEditingId}
      setEditContent={setEditContent}
      replyTargetId={replyTargetId}
      setReplyTargetId={setReplyTargetId}
      replyContent={replyContent}
      setReplyContent={setReplyContent}
      handleReplySubmit={handleReplySubmit}
      handleReplyCancel={handleReplyCancel}
      handleCommentReport={handleCommentReport}
      handleReplyReport={handleReplyReport}
      commentType="basic" // ✅ 일반 게시판은 textarea 사용
    />
  );
};

export default CommonBoardDetail;
