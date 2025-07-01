import apiClient from "../apiClient";

// end

// 컬럼 생성
export const createColumn = async (tableId) => {
  const response = await apiClient.post(`/erds/tables/${tableId}/columns`, {
    name: "",               // FastAPI에서 기본값과 맞춤
    data_type: "",
    is_primary: false,
    is_foreign: false,
    is_not_null: false,
    default_value: null,
    column_order: 0
  });
  return response.data;
};

// 컬럼 속성 수정 (PATCH /erds/columns/{column_id})
export const patchColumn = async (columnId, updateData) => {
  const response = await apiClient.patch(`/erds/columns/${columnId}`, updateData, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.data;
};

// 컬럼 삭제 (DELETE /erds/columns/{column_id})
export const deleteColumn = async (columnId) => {
  const response = await apiClient.delete(`/erds/columns/${columnId}`);
  return response.data;
};

// 컬럼 순서 변경 API
export const reorderColumns = async (tableId, orderedColumnIds) => {
  const response = await apiClient.put("/erds/columns/reorder", {
    table_id: tableId,
    ordered_column_ids: orderedColumnIds,
  });
  return response.data;
};

// 컬럼의 PK 설정/해제
export const setColumnPrimaryKey = async (columnId, isPrimary) => {
  const response = await apiClient.patch(`/erds/columns/${columnId}/set-primary`, {
    is_primary: isPrimary,
  });
  return response.data;
};

// 컬럼의 FK 해제
export const unsetForeignKey = async (columnId) => {
  const res = await apiClient.patch(`/erds/columns/${columnId}/unset-foreign`);
  return res.data;
};