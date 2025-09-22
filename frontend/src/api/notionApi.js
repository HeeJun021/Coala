import apiClient from "./apiClient";

/** ---------- OAuth / 연결 상태 ---------- */
export async function getNotionStatus() {
  const { data } = await apiClient.get("/auth/notion/status");
  return data; // { connected, workspace_name? }
}

export async function getNotionAuthorizeUrl() {
  const { data } = await apiClient.get("/auth/notion/login");
  return data; // { authorize_url, state }
}

export async function disconnectNotion() {
  const { data } = await apiClient.post("/auth/notion/disconnect");
  return data; // { ok: true }
}

/** ---------- 공유 페이지 목록 (사용자가 선택할 대상) ---------- */
export async function listSharedPages(params = {}) {
  // params: { q?: string }
  const { data } = await apiClient.get("/notion/shared/pages", { params });
  return data; // { items: [{ id, title, emoji, icon_url, url }, ...] }
}

/** ---------- 템플릿 목록/상세 (코알라 DB에 저장된 템플릿) ---------- */
export async function listTemplates() {
  const { data } = await apiClient.get("/templates/");
  return data; // [{ id, key, title, version, description, preview_url }]
}


export async function getTemplate(templateId) {
  const { data } = await apiClient.get(`/templates/${templateId}`);
  return data; // { id, key, title, version, description, doc_json, preview_url }
}


// Notion 퍼블리시
export async function publishToNotion({
  template_id,
  target_page_id,
  title,
  project_id,
  ai_prompt,
  extra_kv,
}) {
  const { data } = await apiClient.post("/notion/publish", {
    template_id,
    target_page_id,
    title,
    project_id,
    ai_prompt,
    extra_kv,
  });
  return data; // { ok, created_page_id, export_history_id, missing_keys, message }
}
