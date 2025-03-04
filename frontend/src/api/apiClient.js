import axios from "axios";

const BASE_URL = "http://localhost:8000"; // 🔥 백엔드 주소

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // ✅ JWT 인증을 위해 쿠키 포함
});

export default apiClient;