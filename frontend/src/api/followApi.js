// src/api/followApi.js
import apiClient from "./apiClient";

// 전체 유저 검색 API
export const searchUsers = async (keyword) => {
  const response = await apiClient.get("/follow/search", {
    params: { keyword },
  });
  return response.data;
};

// 추천 유저 목록 API
export const getRecommendedUsers = async (projectId) => {
  const response = await apiClient.get("/follow/recommended", {
    params: {
      project_id: projectId,
    },
  });
  return response.data;
};
// 팔로잉 목록
export const getFollowings = async () => {
  const response = await apiClient.get("/follow/followings");
  return response.data;
};

// 팔로워 목록
export const getFollowers = async () => {
  const response = await apiClient.get("/follow/followers");
  return response.data;
};

// 팔로우
export const followUser = async (userId) => {
  await apiClient.post(`/follow/${userId}`);
};

// 언팔로우
export const unfollowUser = async (userId) => {
  await apiClient.delete(`/follow/${userId}`);
};
