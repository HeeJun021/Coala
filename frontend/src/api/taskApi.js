import apiClient from "./apiClient";

export const getMyTasks = async () => {
  const response = await apiClient.get("/tasks/my");
  return response.data;
};

export const getTaskById = async (taskId) => {
  const response = await apiClient.get(`/tasks/${taskId}`);
  return response.data;
};

export const createTask = async (taskData) => {
  const response = await apiClient.post("/tasks", taskData);
  return response.data;
};

export const updateTask = async (taskId, updatedData) => {
  const response = await apiClient.patch(`/tasks/${taskId}`, updatedData);
  return response.data;
};

export const deleteTask = async (taskId) => {
  const response = await apiClient.delete(`/tasks/${taskId}`);
  return response.data;
};

export const getMyMemos = async () => {
  const response = await apiClient.get(`/memos/my`);
  return response.data;
};

export const createMemo = async (memoData) => {
  const response = await apiClient.post("/memos", memoData);
  return response.data;
};

export const updateMemo = async (memoId, updatedData) => {
  const response = await apiClient.patch(`/memos/${memoId}`, updatedData);
  return response.data;
};

export const deleteMemo = async (memoId) => {
  const response = await apiClient.delete(`/memos/${memoId}`);
  return response.data;
};