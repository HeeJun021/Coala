import apiClient from "./apiClient";

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