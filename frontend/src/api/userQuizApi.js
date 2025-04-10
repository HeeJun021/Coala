import apiClient from "./apiClient";

export const createUserQuiz = async (quizData) => {
  const response = await apiClient.post("/user-quiz/create", quizData);
  return response.data;
};

export const getAllUserQuizzes = async (search = "", userId = null) => {
  const params = {};
  if (search) params.search = search;
  if (userId) params.user_id = userId;
  const res = await apiClient.get("/user-quiz/user-quizzes", { params });
  return res.data;
};


// ✅ 사용자 퀴즈 상세 조회
export const getUserQuizDetail = async (userquizId) => {
  try {
    const response = await apiClient.get(`/user-quiz/${userquizId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ 사용자 퀴즈 제출
export const submitUserQuiz = async (payload) => {
  try {
    const response = await apiClient.post(`/user-quiz/submit`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserQuizResult = async (uq_submission_id) => {
  try {
    const response = await apiClient.get(`/user-quiz/result/${uq_submission_id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserQuizHistory = async (userId) => {
  const response = await apiClient.get(`/user-quiz/userquiz-history/${userId}`);
  return response.data.quizzes;
};