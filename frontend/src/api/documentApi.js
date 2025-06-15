// 📁 src/api/documentApi.js

import apiClient from "./apiClient"; // ✅ axios 인스턴스

// 🔍 전체 문서 목록 조회
export const getDocuments = async (projectId) => {
  const res = await apiClient.get(`/projects/${projectId}/docs`);
  return res.data;
};

// 📝 문서 생성
export const createDocument = async (projectId, data) => {
  // ✅ title 필수 확인 (optional fallback)
  if (!data?.title?.trim()) throw new Error("제목 누락됨");
  const res = await apiClient.post(`/projects/${projectId}/docs`, data);
  return res.data;
};

// 📄 단일 문서 조회
export const getDocument = async (projectId, docId) => {
  const res = await apiClient.get(`/projects/${projectId}/docs/${docId}`);
  return res.data;
};

// ✏️ 문서 수정 (제목, 설명 등)
export const updateDocument = async (projectId, docId, data) => {
  const res = await apiClient.put(`/projects/${projectId}/docs/${docId}`, data);
  return res.data;
};

// ❌ 문서 삭제
export const deleteDocument = async (projectId, docId) => {
  const res = await apiClient.delete(`/projects/${projectId}/docs/${docId}`);
  return res.data;
};
