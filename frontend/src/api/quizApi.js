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
  

// 특정 퀴즈 상세 조회 API
export const getQuizDetails = async (quizId) => {
  try {
    const response = await apiClient.get(`/quizzes/${quizId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 퀴즈 제출 API 추가
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

// 퀴즈 결과 조회 API
export const getQuizResult = async (quizId, userId) => {
  try {
    const response = await apiClient.get(`/quizzes/${quizId}/result/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 사용자의 푼 퀴즈 목록 가져오기
export const getUserQuizHistory = async (userId) => {
  try {
    const response = await apiClient.get(`/quizzes/history/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 퀴즈 통계 api
export const getQuizStats = async (userId) => {
  try {
    const response = await apiClient.get("/quizzes/stats", {
      params: { user_id: userId },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * 현재 로그인한 사용자가 틀렸던 모든 문제 목록을 가져옵니다. (오답 노트용)
 * @returns {Promise<Array<Object>>} 틀린 문제 객체의 배열. 각 객체는 incorrect_attempts 필드를 포함합니다.
 */
export const getIncorrectQuestions = async (languageId = null) => {
  try {
    // languageId가 있을 경우 쿼리 파라미터로 포함하여 요청
    const config = {
      params: languageId ? { language_id: languageId } : {},
    };
    
    // axios는 params 객체의 값이 null이나 undefined이면 자동으로 해당 파라미터를 제외해 줍니다.
    const response = await apiClient.get("/questions/incorrect", config);
    return response.data;
  } catch (error) {
    console.error("틀린 문제 목록을 가져오는 데 실패했습니다:", error);
    throw error;
  }
};

/**
 * 사용자의 오답 문제 중 지정된 개수만큼 새로운 복습 퀴즈를 생성합니다.
 * @param {object} data - 퀴즈 생성에 필요한 데이터
 * @param {string} data.title - 생성될 퀴즈의 제목
 * @param {number} data.count - 퀴즈에 포함될 문제의 개수
 * @param {number} data.language_id - 퀴즈의 언어 ID
 * @returns {Promise<Object>} 생성된 새로운 퀴즈 객체 (문제 포함)
 */
export const createRetakeQuiz = async ({ title, count, language_id }) => {
  try {
    // POST /quizzes/retake-incorrect
    const response = await apiClient.post("/quizzes/retake-incorrect", {
      title,
      count,
      language_id,
    });
    // 데이터 예시: { quiz_id: 123, title: "...", questions: [...] }
    return response.data;
  } catch (error) {
    console.error("오답 복습 퀴즈 생성에 실패했습니다:", error);
    throw error;
  }
};