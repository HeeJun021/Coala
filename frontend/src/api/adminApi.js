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