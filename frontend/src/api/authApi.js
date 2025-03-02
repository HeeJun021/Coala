import apiClient from "./apiClient";

// ✅ 회원가입
export async function registerUser(userData) {
    const response = await apiClient.post("/users/register", userData);
    return response.data;
}

// ✅ JWT 로그인 요청
export async function loginUser(email, password) {
    const response = await apiClient.post("/auth/login", 
        { email, password }, 
        { withCredentials: true } // ✅ 쿠키 포함
    );
    return response.data;
}


// ✅ 로그인한 사용자 정보 가져오기
export async function getCurrentUser() {
    try {
        const response = await apiClient.get("/auth/me",);
        return response.data;
    } catch (error) {
        console.error("Error fetching current user:", error);
        return null;
    }
}


// ✅ 로그아웃 요청 (JWT 쿠키 삭제)
export const logoutUser = async () => {
    try {
        await apiClient.post("/auth/logout",);
    } catch (error) {
        console.error("로그아웃 실패:", error.response?.data || error.message);
        throw error;
    }
};