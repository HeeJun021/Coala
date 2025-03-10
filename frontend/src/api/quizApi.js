import apiClient from "./apiClient";

export const fetchQuestions = async (params) => {
  try {
    const response = await apiClient.get("/questions/", { params });
    return response.data;
  } catch (error) {
    console.error("🚨 문제 가져오기 실패:", error);
    throw error;
  }
};

export const createQuiz = async (quizData) => {
    try {
      const response = await apiClient.post("/quizzes/", quizData);
      return response.data;
    } catch (error) {
      console.error("🚨 퀴즈 생성 실패:", error);
      throw error;
    }
  };
  