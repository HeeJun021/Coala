import apiClient from "./apiClient";

// 게시글 신고
export const reportBoard = async ({ boardId, reason }) => {
  return await apiClient.post("/api/reports/board", {
    board_id: boardId,
    reason,
  });
};

// 댓글 신고
export const reportComment = async ({ commentId, reason }) => {
  return await apiClient.post("/api/reports/comment", {
    comment_id: commentId,
    reason,
  });
};
