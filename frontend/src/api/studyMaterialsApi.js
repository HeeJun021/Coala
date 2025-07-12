import apiClient from "./apiClient";

// 특정 카테고리의 학습자료 가져오기
export const fetchStudyMaterials = async (category) => {
    try {
        const response = await apiClient.get(`/api/materials/${category}`); 
        return response.data;
    } catch (error) {
        console.error(`🚨 Error fetching study materials for category ${category}:`, error);
        return [];
    }
};

// 특정 카테고리의 예제 가져오기
export const fetchStudyExamples = async (category) => {
    try {
        const response = await apiClient.get(`/api/examples/${category}`); 
        return response.data;
    } catch (error) {
        console.error(`🚨 Error fetching study examples for category ${category}:`, error);
        return [];
    }
};

// 개별 학습 자료 가져오기
export const fetchStudyMaterialById = async (language, id) => {
    if (!language || !id) {
        console.error("🚨 API 요청 실패: language 또는 id가 undefined입니다.", { language, id });
        return null;
    }

    try {
        const response = await apiClient.get(`/api/materials/${language}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`🚨 Error fetching study material ID ${id} for language ${language}:`, error.response?.data || error.message);
        return null;
    }
};

// 언어 목록 가져오기
export const fetchLanguages = async () => {
    try {
        const response = await apiClient.get("/languages"); 
        return response.data;
    } catch (error) {
        console.error("Error fetching languages:", error);
        return [];
    }
};