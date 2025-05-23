import apiClient from "../apiClient";

// ✅ 관계 생성
export const createRelation = async (erdId, relationData) => {
  const response = await apiClient.post(`/erds/${erdId}/relations`, relationData);
  return response.data;
};

// ✅ 관계 삭제 (DELETE /erds/relations/{relation_id})
export const deleteRelation = async (relationId) => {
  const response = await apiClient.delete(`/erds/relations/${relationId}`);
  return response.data;
};