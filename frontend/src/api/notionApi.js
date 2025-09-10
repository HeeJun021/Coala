import apiClient from "./apiClient";


export async function getNotionStatus() {
  const res = await fetch("/auth/notion/status", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch Notion status");
  return res.json(); // { connected: boolean, workspace_name?: string }
}

export async function getNotionAuthorizeUrl() {
  const res = await fetch("/auth/notion/login", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to get Notion authorize URL");
  return res.json(); // { authorize_url: string }
}

export async function disconnectNotion() {
  const res = await fetch("/auth/notion/disconnect", {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to disconnect Notion");
  return res.json(); // { ok: true }
}
