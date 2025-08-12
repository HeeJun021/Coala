import apiClient from "./apiClient";

// 게시판 목록 조회
export const getBoardList = async (boardType, page = 1, sortOrder = "최신 순") => {
  const response = await apiClient.get(`/board/posts/${boardType}`, {
    params: { page, sort_order: sortOrder },
  });
  return response.data;
};

// 게시글 상세 조회
export const getBoardDetail = async (postId) => {
  try {
    const response = await apiClient.get(`/board/post/${postId}`);
    return response.data;
  } catch (error) {
    console.error("getBoardDetail error:", error.response?.data || error.message);
    throw error;
  }
};

// 게시글 생성
export const createBoard = async ({
  boardType,
  title,
  content,
  user_id,
  code = "",
  image_url = "",
  recruit_limit = 1,
  code_filename = "",
  code_language = "javascript",
}) => {
  const response = await apiClient.post(
    `/board/posts`,
    {
      board_type: boardType,
      title,
      content,
      user_id: Number(user_id),
      code,
      image_url,
      recruit_limit,
      code_filename,
      code_language,
    },
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  return response.data;
};

// ✅ 게시글 수정 (boardType에 따라 전송 필드 분기)
export const updateBoard = async (postId, payload, boardType = "free") => {
  const basePayload = {
    title: payload.title,
    content: payload.content,
  };

  if (boardType === "code") {
    basePayload.code = payload.code || "";
    basePayload.code_filename = payload.code_filename || "";
    basePayload.code_language = payload.code_language || "javascript";
  }

  if (boardType === "project") {
    basePayload.recruit_limit =
      payload.recruit_limit !== undefined ? payload.recruit_limit : 1;
  }

  return await apiClient.put(`/board/post/${postId}`, basePayload);
};

// 게시글 삭제
export const deleteBoard = async (postId) => {
  return await apiClient.delete(`/board/post/${postId}`);
};

// 프로젝트 게시판 참여 신청
export const applyToProject = async (postId, data) => {
  return await apiClient.post(`/board/post/${postId}/apply`, data, {
    withCredentials: true,
  });
};

// 지원자 목록 조회
export const getProjectApplicants = async (postId) => {
  const response = await apiClient.get(`/board/post/${postId}/applicants`);
  return response.data;
};

// 지원자 상태 업데이트
export const updateApplicantStatus = async (applicantId, status) => {
  return await apiClient.put(`/board/post/applicant/${applicantId}/status`, null, {
    params: { status },
  });
};

// 내가 쓴 게시글 조회
export const getMyPosts = async (userId) => {
  const response = await apiClient.get(`/board/my/posts`, {
    params: { user_id: userId },
  });
  return response.data;
};

// 내가 쓴 댓글 조회
export const getMyComments = async (userId) => {
  const response = await apiClient.get(`/board/my/comments`, {
    params: { user_id: userId },
  });
  return response.data;
};
