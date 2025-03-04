import apiClient from "./apiClient";

// ✅ 사용자 정보 가져오기
export const getUserById = async (userId) => {
    try {
        const response = await apiClient.get(`/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch user data:", error);
        throw error;
    }
};

// ✅ 사용자 정보 업데이트 (닉네임, 자기소개, 개발 직군)
export const updateUserInfo = async (userId, userData) => {
    try {
        const response = await apiClient.put(`/users/${userId}`, userData);
        return response.data;
    } catch (error) {
        console.error("Failed to update user info:", error);
        throw error;
    }
};

// ✅ 이메일 인증 코드 요청
export async function requestEmailVerification(email) {
    const response = await apiClient.post("/auth/email/request", { email });
    return response.data;
}

// ✅ 이메일 인증 코드 확인
export async function verifyEmail(email, token) {
    const response = await apiClient.post("/auth/email/verify", { email, token });
    return response.data;
}
