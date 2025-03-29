// src/api/codingTestApi.js
import apiClient from "./apiClient";

// 문제 리스트 조회
export const getCodingTestList = async (params) => {
  const res = await apiClient.get("/codingtest/list", { params });
  return res.data;
};

// 문제 상세 조회
export const getCodingTestDetail = async (testId) => {
  const res = await apiClient.get(`/codingtest/${testId}`);
  return res.data;
};

// 스타터 코드 조회
export const getStarterCode = async (language) => {
    const res = await apiClient.get(`/language-starter-code/${language}`);
    return res.data;
  };  