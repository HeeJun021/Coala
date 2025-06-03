import apiClient from "./apiClient";

export const getDocuments = (projectId) =>
  apiClient.get(`/projects/${projectId}/docs`).then((res) => res.data);

export const createDocument = (projectId, data) =>
  apiClient.post(`/projects/${projectId}/docs`, data).then((res) => res.data);

export const getDocument = (projectId, docId) =>
  apiClient.get(`/projects/${projectId}/docs/${docId}`).then((res) => res.data);

export const updateDocument = (projectId, docId, data) =>
  apiClient.put(`/projects/${projectId}/docs/${docId}`, data).then((res) => res.data);

export const deleteDocument = (projectId, docId) =>
  apiClient.delete(`/projects/${projectId}/docs/${docId}`).then((res) => res.data);
