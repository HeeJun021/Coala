import apiClient from "../apiClient";

// ✅ 드래그 선택 후 다중 삭제 (테이블 + 컬럼 + 관계)
export const bulkDeleteErdItems = async (erdId, data) => {
  const response = await apiClient.delete(`/erds/${erdId}/bulk-delete`, {
    data, // { table_ids: [...], column_ids: [...], relation_ids: [...] }
  });
  return response.data;
};
