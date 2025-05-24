import apiClient from "../apiClient";

// ✅ 관계 생성
export const createRelation = async (erdId, relationData) => {
  const response = await apiClient.post(`/erds/${erdId}/relations`, relationData);
  return response.data;
};

// ✅ 다중 관계 삭제 (bulk)
export const deleteMultipleRelations = async (erdId, relationIds) => {
  const response = await apiClient.delete(`/erds/${erdId}/bulk-delete`, {
    data: {
      table_ids: [],
      column_ids: [],
      relation_ids: relationIds,
    },
  });
  return response.data;
};
