import apiClient from "./apiClient";

// 게시글 좋아요 등록
export const likeBoard = async (boardId) => {
  return await apiClient.post(`/api/likes`, { board_id: boardId });
};

// 게시글 좋아요 취소
export const unlikeBoard = async (boardId) => {
  return await apiClient.delete(`/api/likes/${boardId}`);
};

// 좋아요 여부 확인
export const checkLiked = async (boardId) => {
  const response = await apiClient.get(`/api/likes/check`, {
    params: { board_id: boardId },
  });
  return response.data; // { liked: true, count: 3 }
};
