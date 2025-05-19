// src/api/taskApi.js
import apiClient from "./apiClient"; // 기본 axios 인스턴스 사용

// ✅ 내 작업 전체 불러오기
export const getMyTasks = async () => {
  const response = await apiClient.get("/tasks/my");
  return response.data; // [{ task_id, title, due_date, status, priority, project_name, created_at, collaborators: [] }]
};

// ✅ 특정 작업 상세 정보 불러오기 (모달용)
export const getTaskById = async (taskId) => {
  const response = await apiClient.get(`/tasks/${taskId}`);
  return response.data;
};

// ✅ (선택) 작업 생성
export const createTask = async (taskData) => {
  const response = await apiClient.post("/tasks", taskData);
  return response.data;
};

// ✅ (선택) 작업 수정
export const updateTask = async (taskId, updatedData) => {
  const response = await apiClient.patch(`/tasks/${taskId}`, updatedData);
  return response.data;
};
