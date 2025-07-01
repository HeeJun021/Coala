import apiClient from "./apiClient";

// 사용자 정보 업데이트 (닉네임, 자기소개, 개발 직군)
export const updateUserInfo = async (userId, userData) => {
  try {
    const response = await apiClient.put(`/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error("Failed to update user info:", error);
    throw error;
  }
};

// 이메일 인증 코드 요청
export async function requestEmailVerification(email) {
  const response = await apiClient.post("/auth/email/request", { email });
  return response.data;
}

// 이메일 인증 코드 확인
export async function verifyEmail(email, token) {
  const response = await apiClient.post("/auth/email/verify", { email, token });
  return response.data;
}

// 프로필 이미지 업데이트 (화폐 차감 포함)
export const updateProfileImage = async ({ profile_image_url, action }) => {
  return await apiClient.patch("/users/profile-image", {
    image_url: profile_image_url,
    action,
  });
};

// 사용자 정보 조회 (닉네임, 자기소개, 등급 등)
export const fetchUserProfile = async (userId) => {
  try {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    throw error;
  }
};
