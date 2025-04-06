import apiClient from "./apiClient";

// 게시글 목록 조회
export const getBoardList = async (boardType) => {
  const response = await apiClient.get(`/api/boards`, {
    params: { type: boardType },
  });
  return response.data;
};

// 게시글 상세 조회
export const getBoardDetail = async (postId) => {
  const response = await apiClient.get(`/api/boards/${postId}`);
  return response.data;
};

// 게시글 생성
export const createBoard = async ({ boardType, title, content }) => {
  const response = await apiClient.post(`/api/boards`, {
    type: boardType,
    title,
    content,
  });
  return response.data;
};

// 게시글 수정
export const updateBoard = async (postId, { title, content }) => {
  return await apiClient.put(`/api/boards/${postId}`, { title, content });
};

// 게시글 삭제
export const deleteBoard = async (postId) => {
  return await apiClient.delete(`/api/boards/${postId}`);
};