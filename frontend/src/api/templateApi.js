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

export async function materializeTemplate({ templateId, folderName, overwrite = false, idempotencyKey }) {
  const payload = {
    template_id: templateId,
    overwrite: !!overwrite,
  };
  if (folderName) payload.folder_name = folderName;
  if (idempotencyKey) payload.idempotency_key = idempotencyKey;

  const { data } = await apiClient.post("/freecode/templates/materialize", payload, {
    // 쿠키 기반 인증이면 필요 없음. 토큰 헤더를 쓰면 아래 참고
    // headers: { Authorization: `Bearer ${token}` }
  });
  return data; // { top_folder_id, created_folders, created_files, open_files }
}