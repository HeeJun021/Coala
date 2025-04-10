import apiClient from "./apiClient";

// ✅ 게시글 신고
export const reportBoard = async ({ post_id, user_id, reason }) => {
  return await apiClient.post("/board/post/report", {
    post_id: Number(post_id),
    user_id: Number(user_id),
    reason,
  });
};

// ✅ 댓글 신고
export const reportComment = async ({ comment_id, user_id, reason }) => {
  return await apiClient.post("/board/comment/report", {
    comment_id: Number(comment_id),
    user_id: Number(user_id),
    reason,
  });
};
