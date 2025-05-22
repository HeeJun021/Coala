// api/erdApi.js
import apiClient from "../apiClient";

// 1. ERD 목록 조회
export const getErds = async (projectId) => {
  const response = await apiClient.get(`/projects/${projectId}/erds`);
  return response.data;
};

// 2. ERD 생성
export const createErd = async (projectId, erdData) => {
  const response = await apiClient.post(`/projects/${projectId}/erds`, erdData);
  return response.data;
};

// 3. ERD 삭제
export const deleteErd = async (projectId, erdId) => {
  const response = await apiClient.delete(`/projects/${projectId}/erds/${erdId}`);
  return response.data;
};
