import apiClient from "./apiClient"; // axios 인스턴스

// 1. 새로운 GPT 세션 생성 + 첫 메시지 전송
export const createGptSession = async ({ context, message }) => {
  const res = await apiClient.post("/gpt/sessions/new", { context, message });
  return res.data;
};

// 2. 기존 세션에 메시지 추가 전송
export const sendGptMessage = async (sessionId, message) => {
  const res = await apiClient.post(`/gpt/sessions/${sessionId}/message`, { message });
  return res.data;
};

// 3. 전체 GPT 세션 목록 조회
export const fetchGptSessions = async () => {
  const res = await apiClient.get("/gpt/sessions");
  return res.data;
};

// 4. GPT 세션 상세 조회 (메시지 포함)
export const fetchGptSessionDetail = async (sessionId) => {
  const res = await apiClient.get(`/gpt/sessions/${sessionId}`);
  return res.data;
};

// 5. GPT 세션 삭제
export const deleteGptSession = async (sessionId) => {
  await apiClient.delete(`/gpt/sessions/${sessionId}`);
};

// 6. GPT 세션 제목 수정
export const updateGptSessionTitle = async (sessionId, title) => {
  const res = await apiClient.patch(`/gpt/sessions/${sessionId}`, { title });
  return res.data;
};
