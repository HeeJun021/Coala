import apiClient from "./apiClient";

// ✅ 비밀번호 찾기 - 이메일 인증 코드 요청
export async function requestPasswordReset(email) {
    const response = await apiClient.post("/auth/password-reset/email", { email });
    return response.data;
}

// ✅ 비밀번호 찾기 - 인증 코드 확인
export async function verifyPasswordReset(email, token) {
    const response = await apiClient.post("/auth/password-reset/verify", { email, token });
    return response.data;
}

// ✅ 비밀번호 변경
export async function resetPassword(email, newPassword) {
    const response = await apiClient.post("/auth/password-reset/change", { email, new_password: newPassword });
    return response.data;
}
