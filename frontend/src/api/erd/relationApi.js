import apiClient from "../apiClient";

// ✅ 관계 생성
export const createRelation = async (erdId, relationData) => {
  const response = await apiClient.post(`/erds/${erdId}/relations`, relationData);
  return response.data;
};

// ✅ 관계 삭제
export const deleteRelation = async (relationId) => {
  const response = await apiClient.delete(`/relations/${relationId}`);
  return response.data;
};
