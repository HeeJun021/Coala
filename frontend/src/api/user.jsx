import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000'; // 백엔드 API 기본 URL

export const getUserById = async (userId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch user data:", error);
        throw error;
    }
};

// 사용자 정보 업데이트 (닉네임, 자기소개, 개발 직군)
export const updateUserInfo = async (userId, userData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/users/${userId}`, userData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Failed to update user info:", error);
        throw error;
    }
};
