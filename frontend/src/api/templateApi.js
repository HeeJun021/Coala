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

export const getTemplateCatalog = async () =>
   (await apiClient.get(`/template-catalog`)).data;

export const getTemplateCatalogItem = async (catalogId) =>
   (await apiClient.get(`/template-catalog/${catalogId}`)).data;

export const createTemplateFromCatalog = async (projectId, catalogId) =>
  (await apiClient.post(`/projects/${projectId}/templates/from-catalog`, {
    catalog_id: catalogId,
  })).data;

// ✅ 추가: Trello 보드에서 바로 템플릿 생성
export const importTemplateFromTrello = async (projectId, { board, title }) =>
  (await apiClient.post(`/projects/${projectId}/templates/import/trello`, { board, title })).data;
