import apiClient from "./apiClient";

export const fetchQuestions = async (params) => {
  try {
    const response = await apiClient.get("/questions/", { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createQuiz = async (quizData) => {
    try {
      const response = await apiClient.post("/quizzes/", quizData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };
  

// ✅ 특정 퀴즈 상세 조회 API
export const getQuizDetails = async (quizId) => {
  try {
    const response = await apiClient.get(`/quizzes/${quizId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ 퀴즈 제출 API 추가
export const submitQuiz = async (quizId, userId, mode, answers) => {
  try {
    const response = await apiClient.post(`/quizzes/${quizId}/submit`, {
      quiz_id: quizId,
      user_id: userId,
      mode: mode,
      answers: answers.map(answer => ({
        question_id: answer.questionId,
        user_answer: answer.userAnswer
      }))
    });

    return response.data; // 서버 응답 데이터 반환
  } catch (error) {
    throw error;
  }
};

// ✅ 퀴즈 결과 조회 API
export const getQuizResult = async (quizId, userId) => {
  try {
    const response = await apiClient.get(`/quizzes/${quizId}/result/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ 사용자의 푼 퀴즈 목록 가져오기
export const getUserQuizHistory = async (userId) => {
  try {
    const response = await apiClient.get(`/quizzes/history/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
