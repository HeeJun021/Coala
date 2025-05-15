import apiClient from "./apiClient";

export const getBoardList = async (boardType, page = 1, sortOrder = "최신 순") => {
  const response = await apiClient.get(`/board/posts/${boardType}`, {
    params: { page, sort_order: sortOrder },
  });
  return response.data;
};

export const getBoardDetail = async (postId) => {
  try {
    const response = await apiClient.get(`/board/post/${postId}`);
    return response.data;
  } catch (error) {
    console.error("getBoardDetail error:", error.response?.data || error.message);
    throw error;
  }
};

export const createBoard = async ({ boardType, title, content, code, user_id, code_filename, code_language }) => {
  const response = await apiClient.post(`/board/posts`, {
    board_type: boardType,
    title,
    content,
    code,
    user_id: Number(user_id),
    code_filename,
    code_language,
  });
  return response.data;
};

export const updateBoard = async (postId, { title, content, code, code_filename, code_language }) => {
  return await apiClient.put(`/board/post/${postId}`, {
    title,
    content,
    code,
    code_filename,
    code_language,
  });
};

export const deleteBoard = async (postId) => {
  return await apiClient.delete(`/board/post/${postId}`);
};