import apiClient from "./apiClient";

// 1. 알림 목록 조회
export const fetchNotifications = () =>
  apiClient.get("/notifications");

// 2. 알림 읽음 처리
export const markNotificationAsRead = (notificationId) =>
  apiClient.patch(`/notifications/${notificationId}/read`);

// (선택) 알림 삭제
export const deleteNotification = (notificationId) =>
  apiClient.delete(`/notifications/${notificationId}`);
