import apiClient from "../apiClient";

// ✅ 테이블 생성
export const createTable = async (erdId, tableData) => {
  const response = await apiClient.post(`/erds/${erdId}/tables`, tableData);
  return response.data;
};

// ✅ 테이블 삭제 (단일)
export const deleteTable = async (tableId) => {
  const response = await apiClient.delete(`/tables/${tableId}`);
  return response.data;
};

// ✅ 테이블 다중 삭제
export const deleteMultipleTables = async (tableIds) => {
  const response = await apiClient.delete(`/tables/bulk`, {
    data: { table_ids: tableIds },
  });
  return response.data;
};
