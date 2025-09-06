import apiClient from "./apiClient";

export const getTemplates = async (projectId) =>
  (await apiClient.get(`/projects/${projectId}/templates`)).data;

export const getTemplate = async (projectId, templateId) =>
  (await apiClient.get(`/projects/${projectId}/templates/${templateId}`)).data;

export const addTemplate = async (projectId, payload) =>
  (await apiClient.post(`/projects/${projectId}/templates`, payload)).data;

export const deleteTemplate = async (projectId, templateId) =>
  (await apiClient.delete(`/projects/${projectId}/templates/${templateId}`)).data;

export const updateTemplate = async (projectId, templateId, payload) =>
  (await apiClient.patch(`/projects/${projectId}/templates/${templateId}`, payload)).data;
