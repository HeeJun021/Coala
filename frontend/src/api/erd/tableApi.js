import apiClient from "../apiClient";

// end

// 테이블 생성
export const createTable = async (erdId, tableData) => {
  const response = await apiClient.post(`/erds/${erdId}/tables`, tableData);
  console.log("테이블 생성 응답:", response.data);  // 이거 추가
  return response.data;
};

// 테이블 이름/설명/위치 등 수정 (PATCH /erds/{erd_id}/tables/{table_id})
export const patchTable = async (erdId, tableId, updateData) => {
  const response = await apiClient.patch(`/erds/${erdId}/tables/${tableId}`, updateData);
  return response.data;
};

// 테이블 삭제 (버튼형 단일 삭제)
export const deleteTable = async (tableId) => {
  const response = await apiClient.delete(`/erds/tables/${tableId}`);
  return response.data;
};


// 테이블 다중 삭제 (bulk)
export const deleteMultipleTables = async (erdId, tableIds) => {
  const response = await apiClient.delete(`/erds/${erdId}/bulk-delete`, {
    data: {
      table_ids: tableIds,
      column_ids: [],
      relation_ids: [],
    },
  });
  return response.data;
};
