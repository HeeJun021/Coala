import apiClient from "./apiClient";

// 문제 리스트 조회
export const getCodingTestList = async (params) => {
  const res = await apiClient.get("/codingtest/list", { params });
  return res.data;
};

// 문제 상세 조회
export const getCodingTestDetail = async (testId) => {
  const res = await apiClient.get(`/codingtest/${testId}`);
  return res.data;
};

// 문제별 스타터 코드 조회
export const getStarterCode = async (testId, language) => {
  const res = await apiClient.get(`/problem-starter-code/${testId}/${language}`);
  return res.data;
};


// 코드 제출
export const submitCodingTest = async (data) => {
  const res = await apiClient.post("/codingtest/submit", data);
  return res.data;
};

// 제출 내역 조회
export const getSubmissionList = async (testId, userId) => {
  const res = await apiClient.get(`/codingtest/submissions/${testId}`, {
    params: { user_id: userId },
  });
  return res.data;
};

// 코드 실행 요청
export const runCodeWithTestcases = async (testId, code, language) => {
  const res = await apiClient.post(`/code-exec/run/${testId}`, {
    code,
    language,
  });
  return res.data;
};

// 코드 제출 API
export const submitCode = async ({ user_id, test_id, code, language }) => {
  const res = await apiClient.post("/codingtest/submit", {
    user_id,
    test_id,
    code,
    language,
  });
  return res.data;
};

export const getCorrectSolutions = async (testId) => {
  const res = await apiClient.get(`/codingtest/solutions/${testId}`);
  return res.data;
};

export const getAllSubmissionsByUser = async (userId) => {
  const res = await apiClient.get(`/codingtest/submissions/user/${userId}`);
  return res.data;
};

// ✅ 다른 사람 풀이 보기 기록
export const markViewedOthers = async (testId) => {
  return await apiClient.post("/codingtest/solution-view", {
    test_id: testId,
  });
};

export const checkHasSolved = async (testId) => {
  return await apiClient.get(`codingtest/${testId}/has-solved`);
};
