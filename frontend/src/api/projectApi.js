// src/api/projectApi.js
import apiClient from "./apiClient";

// ✅ 로그인된 사용자의 프로젝트 목록 가져오기
export const getMyProjects = async () => {
  const response = await apiClient.get("/projects/my");
  return response.data;
};

// ✅ 특정 프로젝트의 팀원 목록 불러오기
export const getProjectMembers = async (projectId) => {
  const response = await apiClient.get(`/projects/${projectId}/members`);
  return response.data;
};
