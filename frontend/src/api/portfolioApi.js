import apiClient from "./apiClient";

export async function getPortfolioExportHistory({ page = 1, limit = 15 } = {}) {
  const res = await fetch(`/portfolio/history?page=${page}&limit=${limit}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch portfolio export history");
  return res.json(); 
  // 기대 응답: { items: [{export_id, title, block_count, status, created_at, duration_ms, page_id }], total: number }
}