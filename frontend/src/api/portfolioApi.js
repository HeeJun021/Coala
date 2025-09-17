import apiClient from "./apiClient";

export async function getPortfolioExportHistory({ page = 1, limit = 15 } = {}) {
  const { data } = await apiClient.get("/portfolio/history", { params: { page, limit } });
  return data; // { items, total }
}


// 1) 내 프로필 조회(최초 사용자면 빈 값들 반환되도록 백엔드 구현 가정)
// GET /portfolio/profile/me  -> { user_id, full_name, birth_date, phone, email, education:[], career:[] }
export async function getMyPortfolioProfile() {
  const { data } = await apiClient.get("/portfolio/profile/me");
  return data;
}

// 2) 내 프로필 저장/업서트
// PUT /portfolio/profile  body: { full_name?, birth_date?, phone?, email?, education?:[], career?:[] }
export async function upsertMyPortfolioProfile(payload) {
  const { data } = await apiClient.put("/portfolio/profile", payload);
  return data;
}
