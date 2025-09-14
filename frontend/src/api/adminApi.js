import apiClient from "./apiClient";

// 대시보드
export const fetchAdminSummary = async () => {
  const response = await apiClient.get("/admin/summary");
  return response.data;
};
export const fetchRecentReports = async () => {
  const response = await apiClient.get("/admin/reports/recent");
  return response.data;
};
export const fetchWeeklyReportTrend = async () => {
  const response = await apiClient.get("/admin/reports/weekly");
  return response.data;
};

// 문제 관리
export const createQuestion = async (questionData) => {
  const response = await apiClient.post("/admin/questions/create", questionData);
  return response.data;
};
export const deleteQuestion = async (questionId) => {
  const response = await apiClient.delete(`/admin/questions/${questionId}`);
  return response.data;
};

// 사용자 관리
export const fetchAdminUsers = async () => {
  const response = await apiClient.get("/admin/users");
  return response.data;
};
export const fetchAdminUserDetail = async (userId) => {
  const response = await apiClient.get(`/admin/users/${userId}`);
  return response.data;
};
export const getUserProfile = async (userId) => {
  return await fetchAdminUserDetail(userId);
};
export const getUserNickname = async (userId) => {
  try {
    const u = await getUserProfile(userId);
    return u?.nickname ?? u?.name ?? u?.display_name ?? "알 수 없음";
  } catch {
    return "알 수 없음";
  }
};

// 게시판 관리
export const fetchAdminPosts = async (boardType) => {
  const response = await apiClient.get("/admin/posts", {
    params: { board_type: boardType },
  });
  return response.data;
};
export const fetchAdminPostById = async (postId) => {
  const response = await apiClient.get(`/admin/posts/${postId}`);
  return response.data;
};
export const fetchAdminComments = async (postId) => {
  const response = await apiClient.get(`/admin/posts/${postId}/comments`);
  return response.data;
};
export const deleteAdminPost = async (postId) => {
  const response = await apiClient.delete(`/admin/posts/${postId}`);
  return response.data;
};
export const deleteAdminComment = async (commentId) => {
  const response = await apiClient.delete(`/admin/comments/${commentId}`);
  return response.data;
};

// 학습자료 / 예제
export const fetchStudyMaterialSummary = async (language) => {
  const res = await apiClient.get("/admin/study-materials/summary", {
    params: { language },
  });
  return res.data;
};
export const fetchStudyMaterialById = async (language, materialId) => {
  const res = await apiClient.get(`/api/materials/${language}/${materialId}`);
  return res.data;
};
export const fetchStudyExamples = async (language) => {
  const res = await apiClient.get(`/api/examples/${language}`);
  return res.data;
};
export const deleteStudyMaterial = async (materialId) => {
  const res = await apiClient.delete(`/admin/study-materials/${materialId}`);
  return res.data;
};
export const updateStudyMaterial = async (materialId, materialData) => {
  const response = await apiClient.put(`/admin/study-materials/${materialId}`, materialData);
  return response.data;
};
export const updateStudyExample = async (exampleId, exampleData) => {
  const response = await apiClient.put(`/admin/examples/${exampleId}`, exampleData);
  return response.data;
};
export const deleteStudyExample = async (exampleId) => {
  const response = await apiClient.delete(`/admin/examples/${exampleId}`);
  return response.data;
};

// 언어 관리
export const updateLanguage = async (languageId, languageData) => {
  const response = await apiClient.put(`/admin/languages/${languageId}`, languageData);
  return response.data;
};
export const createLanguage = async (languageData) => {
  const response = await apiClient.post("/admin/languages/create", languageData);
  return response.data;
};
export const deleteLanguage = async (languageId) => {
  const response = await apiClient.delete(`/admin/languages/${languageId}`);
  return response.data;
};
