// src/api/adminCodingTestApi.js
import apiClient from "./apiClient"; // axios 인스턴스

// 코딩 테스트 목록 조회
export const fetchAdminCodingTests = async () => {
  const res = await apiClient.get("/admin/codingtest/list");
  return res.data;
};

// 코딩 테스트 상세 조회
export const fetchAdminCodingTestDetail = async (testId) => {
  const res = await apiClient.get(`/admin/codingtest/${testId}`);
  return res.data;
};

// 코딩 테스트 생성
export const createAdminCodingTest = async (payload) => {
  const res = await apiClient.post("/admin/codingtest/create", payload);
  return res.data;
};

// 코딩 테스트 수정
export const updateAdminCodingTest = async (testId, payload) => {
  const res = await apiClient.put(`/admin/codingtest/${testId}/update`, payload);
  return res.data;
};

// 코딩 테스트 삭제
export const deleteAdminCodingTest = async (testId) => {
  const res = await apiClient.delete(`/admin/codingtest/${testId}/delete`);
  return res.data;
};

// 스타터 코드 등록/수정
export const upsertStarterCode = async (testId, payload) => {
  const res = await apiClient.post(`/admin/codingtest/${testId}/starter-code`, payload);
  return res.data;
};

// 통계 조회
export const fetchSubmissionStats = async (testId) => {
  const res = await apiClient.get(`/admin/codingtest/${testId}/stats`);
  return res.data;
};

// 테스트케이스 추가
export const addTestcase = async (testId, payload) => {
  const res = await apiClient.post(`/admin/codingtest/${testId}/testcases`, payload);
  return res.data;
};

// 테스트케이스 수정
export const updateTestcase = async (testcaseId, payload) => {
  const res = await apiClient.put(`/admin/codingtest/testcases/${testcaseId}`, payload);
  return res.data;
};

// 테스트케이스 삭제
export const deleteTestcase = async (testcaseId) => {
  const res = await apiClient.delete(`/admin/codingtest/testcases/${testcaseId}`);
  return res.data;
};

// 제약조건 추가
export const addConstraint = async (testId, payload) => {
  const res = await apiClient.post(`/admin/codingtest/${testId}/constraints`, payload);
  return res.data;
};

// 제약조건 수정
export const updateConstraint = async (constraintId, payload) => {
  const res = await apiClient.put(`/admin/codingtest/constraints/${constraintId}`, payload);
  return res.data;
};

// 제약조건 삭제
export const deleteConstraint = async (constraintId) => {
  const res = await apiClient.delete(`/admin/codingtest/constraints/${constraintId}`);
  return res.data;
};

export const fetchAdminTestSubmissions = async (testId) => {
  const res = await apiClient.get(`/admin/codingtest/${testId}/submissions`);
  return res.data;
};