import apiClient from "./apiClient";

// 게시글 좋아요 등록
export const likeBoard = async (postId, userId) => {
  return await apiClient.post(`/board/post/like`, {
    post_id: Number(postId),
    user_id: Number(userId),
  });
};

// 게시글 좋아요 취소
export const unlikeBoard = async (postId, userId) => {
  return await apiClient.post(`/board/post/unlike`, {
    post_id: Number(postId),
    user_id: Number(userId),
  });
};

// 게시글 좋아요 여부 확인
export const checkLiked = async (postId, userId) => {
  const response = await apiClient.get(`/board/post/${postId}/liked`, {
    params: {
      user_id: Number(userId),
    },
  });
  return response.data; // { liked: true, count: 3 }
};

// 댓글 좋아요 등록
export const likeComment = async (commentId, userId) => {
  return await apiClient.post(`/board/comment/like`, {
    comment_id: Number(commentId),
    user_id: Number(userId),
  });
};

// 댓글 좋아요 취소
export const unlikeComment = async (commentId, userId) => {
  return await apiClient.post(`/board/comment/unlike`, {
    comment_id: Number(commentId),
    user_id: Number(userId),
  });
};

// 댓글 좋아요 여부 확인
export const checkCommentLiked = async (commentId, userId) => {
  const response = await apiClient.get(`/board/comment/${commentId}/liked`, {
    params: {
      user_id: Number(userId),
    },
  });
  return response.data; // { liked: true, count: 5 }
};
