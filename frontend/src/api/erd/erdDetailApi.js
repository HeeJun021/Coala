import apiClient from "../apiClient";

// 상세조회만 가능 나머지 연동해야됨

// ✅ ERD 상세 조회
export const getErdDetail = async (erdId) => {
  const response = await apiClient.get(`/erds/${erdId}`);
  return response.data;
};

// ✅ ERD 자동 저장 (2초마다 호출)
export const syncErd = async (erdId, data) => {
  const response = await apiClient.put(`/erds/${erdId}/sync`, data);
  return response.data;
};

// ✅ ERD 활동 로그 저장 (사용자가 직접 클릭 시 호출)
export const commitErd = async (erdId, data) => {
  const response = await apiClient.post(`/erds/${erdId}/commit`, data);
  return response.data;
};
