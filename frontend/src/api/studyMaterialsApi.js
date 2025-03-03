import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api";

// ✅ 전체 학습 자료 가져오기 (수정됨)
export const fetchStudyMaterials = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/materials`);
        return response.data;
    } catch (error) {
        console.error("Error fetching study materials:", error);
        return [];
    }
};

// ✅ 전체 예제 가져오기 (수정됨)
export const fetchStudyExamples = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/examples`);
        return response.data;
    } catch (error) {
        console.error("Error fetching study examples:", error);
        return [];
    }
};

// ✅ 개별 학습 자료 가져오기 추가
export const fetchStudyMaterialById = async (language, id) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/materials/${language}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching study material ${id}:`, error);
        return null;
    }
};
