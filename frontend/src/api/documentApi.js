import apiClient from "./apiClient";  // ✅ 통일해서 이것만 사용하도록

// 전체 문서 목록 조회
export const getDocuments = async (projectId) => {
  const res = await apiClient.get(`/projects/${projectId}/docs`);
  return res.data;
};

// 문서 생성
export const createDocument = async (projectId, data) => {
  const res = await apiClient.post(`/projects/${projectId}/docs`, data);
  return res.data;
};

// 단일 문서 조회
export const getDocument = async (projectId, docId) => {
  const res = await apiClient.get(`/projects/${projectId}/docs/${docId}`);
  return res.data;
};

// 문서 수정
export const updateDocument = async (projectId, docId, data) => {
  const res = await apiClient.put(`/projects/${projectId}/docs/${docId}`, data);
  return res.data;
};

// 문서 삭제
export const deleteDocument = async (projectId, docId) => {
  const res = await apiClient.delete(`/projects/${projectId}/docs/${docId}`);
  return res.data;
};
