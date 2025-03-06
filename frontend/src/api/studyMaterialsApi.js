import apiClient from "./apiClient";

const API_BASE_URL = "/api"; // 이미 apiClient에서 BASE_URL을 설정했으므로 상대 경로 사용

// ✅ 전체 학습 자료 가져오기 (수정됨)
export const fetchStudyMaterials = async () => {
    try {
        const response = await apiClient.get(`${API_BASE_URL}/materials`);
        return response.data;
    } catch (error) {
        console.error("Error fetching study materials:", error);
        return [];
    }
};

// ✅ 전체 예제 가져오기 (수정됨)
export const fetchStudyExamples = async () => {
    try {
        const response = await apiClient.get(`${API_BASE_URL}/examples`);
        return response.data;
    } catch (error) {
        console.error("Error fetching study examples:", error);
        return [];
    }
};

// ✅ 개별 학습 자료 가져오기 추가
export const fetchStudyMaterialById = async (language, id) => {
    try {
        const response = await apiClient.get(`${API_BASE_URL}/materials/${language}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching study material ${id}:`, error);
        return null;
    }
};
