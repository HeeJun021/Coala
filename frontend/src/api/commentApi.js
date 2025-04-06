import apiClient from "./apiClient";

// 댓글 목록 조회
export const getComments = async (postId) => {
  const response = await apiClient.get(`/api/comments`, {
    params: { post_id: postId },
  });
  return response.data;
};

// 댓글 작성
export const createComment = async ({ postId, parentId = null, content }) => {
  const response = await apiClient.post(`/api/comments`, {
    post_id: postId,
    parent_id: parentId,
    content,
  });
  return response.data;
};

// 댓글 수정
export const updateComment = async (commentId, { content }) => {
  const response = await apiClient.put(`/api/comments/${commentId}`, {
    content,
  });
  return response.data;
};

// 댓글 삭제
export const deleteComment = async (commentId) => {
  const response = await apiClient.delete(`/api/comments/${commentId}`);
  return response.data;
};

