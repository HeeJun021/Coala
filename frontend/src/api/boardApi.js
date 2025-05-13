import apiClient from "./apiClient";

// ✅ 게시판 목록 조회
export const getBoardList = async (boardType, page = 1, sortOrder = "최신 순") => {
  const response = await apiClient.get(`/board/posts/${boardType}`, {
    params: { page, sort_order: sortOrder },
  });
  return response.data;
};

// ✅ 게시글 상세 조회
export const getBoardDetail = async (postId) => {
  const response = await apiClient.get(`/board/post/${postId}`);
  return response.data;
};

// ✅ 게시글 생성 (필수 필드 포함)
export const createBoard = async ({
  boardType,
  title,
  content,
  user_id,
  code = "",            // ✅ 누락 방지
  image_url = "",       // ✅ 누락 방지
  recruit_limit = 1     // ✅ 기본값 설정
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
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// ✅ 게시글 수정
export const updateBoard = async (postId, { title, content }) => {
  return await apiClient.put(`/board/post/${postId}`, {
    title,
    content,
  });
};

// ✅ 게시글 삭제
export const deleteBoard = async (postId) => {
  return await apiClient.delete(`/board/post/${postId}`);
};

// ✅ 프로젝트 게시판 참여 신청
export const applyToProject = async (postId, data) => {
  return await apiClient.post(`/board/post/${postId}/apply`, data, {
    withCredentials: true,
  });
};

// ✅ 지원자 목록 조회
export const getProjectApplicants = async (postId) => {
  const response = await apiClient.get(`/board/post/${postId}/applicants`);
  return response.data;
};

// ✅ 지원자 상태 업데이트
export const updateApplicantStatus = async (applicantId, status) => {
  return await apiClient.put(`/board/post/applicant/${applicantId}/status`, null, {
    params: { status },
  });
};
