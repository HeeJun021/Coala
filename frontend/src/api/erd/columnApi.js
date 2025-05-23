import apiClient from "../apiClient";

// ✅ 컬럼 생성
export const createColumn = async (tableId, columnData) => {
  const response = await apiClient.post(`/tables/${tableId}/columns`, columnData);
  return response.data;
};

// 컬럼 속성 수정 (PATCH /columns/{column_id})
export const patchColumn = async (columnId, updateData) => {
  const response = await apiClient.patch(`/columns/${columnId}`, updateData);
  return response.data;
};

// ✅ 컬럼 삭제
export const deleteColumn = async (columnId) => {
  const response = await apiClient.delete(`/columns/${columnId}`);
  return response.data;
};
