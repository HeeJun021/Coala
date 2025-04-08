import apiClient from "./apiClient";

// ✅ 회원가입
export async function registerUser(userData) {
  const response = await apiClient.post("/users/register", userData);
  return response.data;
}

// ✅ JWT 로그인 요청 (쿠키 저장됨)
export async function loginUser(email, password) {
  const response = await apiClient.post(
    "/auth/login",
    { email, password },
    { withCredentials: true } // ✅ 반드시 필요
  );
  return response.data;
}

// ✅ 현재 로그인한 사용자 정보 (/auth/me)
export const getCurrentUser = () => {
  return apiClient
    .get("/auth/me", { withCredentials: true }) // ✅ JWT 쿠키 포함
    .then((res) => res.data);
};

// ✅ 로그아웃 요청 (쿠키 제거 + 상태 초기화)
export const logoutUser = async () => {
  try {
    await apiClient.post("/auth/logout", null, {
      withCredentials: true, // ✅ 명시적으로 추가 (권장)
    });
  } catch (error) {
    console.error("로그아웃 실패:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ 회원 탈퇴
export const deleteUser = async (userId) => {
  try {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete user:", error);
    throw error;
  }
};
