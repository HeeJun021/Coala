import apiClient from "./apiClient";

export async function getPortfolioExportHistory({ page = 1, limit = 15 } = {}) {
  const { data } = await apiClient.get("/portfolio/history", { params: { page, limit } });
  return data; // { items, total }
}