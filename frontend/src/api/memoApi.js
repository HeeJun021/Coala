import api from "./base"; // axios instance

export const fetchMemos = (projectId) =>
  api.get(`/memos/project/${projectId}`).then((res) => res.data);

export const createMemo = (data) =>
  api.post("/memos", data).then((res) => res.data);

export const updateMemo = (memoId, data) =>
  api.patch(`/memos/${memoId}`, data).then((res) => res.data);

export const deleteMemo = (memoId) =>
  api.delete(`/memos/${memoId}`).then((res) => res.data);
