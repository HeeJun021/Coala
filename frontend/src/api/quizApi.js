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
  

// ✅ 특정 퀴즈 상세 조회 API
export const getQuizDetails = async (quizId) => {
  try {
    const response = await apiClient.get(`/quizzes/${quizId}`);
    return response.data;
  } catch (error) {
    console.error("🚨 퀴즈 데이터를 불러오는 중 오류 발생:", error);
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
    console.error("🚨 퀴즈 제출 실패:", error);
    throw error;
  }
};