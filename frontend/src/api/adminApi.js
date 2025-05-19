import apiClient from "./apiClient"; // 이미 존재하는 apiClient 사용

// 관리자 요약 정보 가져오기
export const fetchAdminSummary = async () => {
  const response = await apiClient.get("/admin/summary");
  return response.data;
};

// 최근 신고 목록 가져오기
export const fetchRecentReports = async () => {
  const response = await apiClient.get("/admin/reports/recent");
  return response.data;
};

export const fetchWeeklyReportTrend = async () => {
  const response = await apiClient.get("/admin/reports/weekly");
  return response.data;
};

// 문제 생성 API
export const createQuestion = async (questionData) => {
  try {
    const response = await apiClient.post("/admin/questions/create", questionData);
    return response.data;
  } catch (error) {
    console.error("문제 생성 실패:", error);
    throw error;
  }
};

// 문제 삭제 API
export const deleteQuestion = async (questionId) => {
  try {
    const response = await apiClient.delete(`/admin/questions/${questionId}`);
    return response.data;
  } catch (error) {
    console.error("문제 삭제 실패:", error);
    throw error;
  }
};

// ✅ 사용자 전체 목록 조회
export const fetchAdminUsers = async () => {
  const response = await apiClient.get("/admin/users");
  return response.data; // [{ user_id, nickname, email, created_at, post_count, comment_count, report_count }, ...]
};

// ✅ 사용자 상세 정보 조회
export const fetchAdminUserDetail = async (userId) => {
  const response = await apiClient.get(`/admin/users/${userId}`);
  return response.data;
  /*
  {
    user_id,
    nickname,
    email,
    created_at,
    tier: { tier_id, tier_name, min_rating },
    report_count,
    posts: [{ post_id, title, board_type, created_at }, ...],
    comments: [{ comment_id, content, post_id, created_at }, ...]
  }
  */
};