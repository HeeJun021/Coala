import apiClient from "./apiClient";

// ✅ 댓글 목록 조회
export const getComments = async (postId) => {
  const response = await apiClient.get(`/board/post/${postId}/comments`);
  return response.data;
};

// ✅ 댓글 작성
export const createComment = async ({ postId, parentId = null, content, user_id }) => {
  const response = await apiClient.post(`/board/post/${postId}/comment`, {
    content,
    parent_comment_id: parentId !== null ? Number(parentId) : null,
    user_id: Number(user_id),
  });
  return response.data;
};

// ✅ 댓글 수정
export const updateComment = async (commentId, { content }) => {
  const response = await apiClient.put(`/board/comment/${commentId}`, {
    content,
  });
  return response.data;
};

// ✅ 댓글 삭제
export const deleteComment = async (commentId) => {
  const response = await apiClient.delete(`/board/comment/${commentId}`);
  return response.data;
};
