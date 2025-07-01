// src/api/eucalyptusApi.js
import apiClient from "./apiClient"; // axios 인스턴스

// 유칼립투스 보상 획득
export const rewardEucalyptus = async (action) => {
  const response = await apiClient.post("/eucalyptus/reward", { action });
  return response.data; // { current_balance, changed_amount }
};

// 유칼립투스 사용 (차감)
export const payEucalyptus = async (action) => {
  const response = await apiClient.post("/eucalyptus/use", { action });
  return response.data; // { current_balance, changed_amount }
};