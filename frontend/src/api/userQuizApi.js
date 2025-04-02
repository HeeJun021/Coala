import apiClient from "./apiClient";

export const createUserQuiz = async (quizData) => {
  const response = await apiClient.post("/user-quiz/create", quizData);
  return response.data;
};
