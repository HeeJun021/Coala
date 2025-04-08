import apiClient from "./apiClient";

export const getLanguages = async () => {
    try {
        const response = await apiClient.get("/languages");
        return response.data;
    } catch (error) {
        console.error("Failed to fetch languages:", error);
        return [];
    }
};
