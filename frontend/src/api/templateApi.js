import apiClient from "./apiClient";

export const getTemplates = (projectId) => {
  return apiClient.get(`/projects/${projectId}/templates`);
};

export const addTemplate = (projectId, templateData) => {
  return apiClient.post(`/projects/${projectId}/templates`, templateData);
};

export const deleteTemplate = (projectId, templateId) => {
  return apiClient.delete(`/projects/${projectId}/templates/${templateId}`);
};
