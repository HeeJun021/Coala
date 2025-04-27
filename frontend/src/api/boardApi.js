import apiClient from "./apiClient";

// 게시판 목록 조회 (page + sort_order 전달)
export const getBoardList = async (boardType, page = 1, sortOrder = "최신 순") => {
  const response = await apiClient.get(`/board/posts/${boardType}`, {
    params: { page, sort_order: sortOrder },  // ✅ 여기 꼭 확인!
  });
  return response.data;
};


// 게시글 상세 조회
export const getBoardDetail = async (postId) => {
  const response = await apiClient.get(`/board/post/${postId}`);
  return response.data;
};

// 게시글 생성
export const createBoard = async ({ boardType, title, content, user_id }) => {
  const response = await apiClient.post(`/board/posts`, {
    board_type: boardType,
    title,
    content,
    user_id: Number(user_id),
  });
  return response.data;
};

// 게시글 수정
export const updateBoard = async (postId, { title, content }) => {
  return await apiClient.put(`/board/post/${postId}`, {
    title,
    content,
  });
};

// 게시글 삭제
export const deleteBoard = async (postId) => {
  return await apiClient.delete(`/board/post/${postId}`);
};