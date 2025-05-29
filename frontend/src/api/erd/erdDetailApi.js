import apiClient from "../apiClient";

// ✅ ERD 상세 조회
export const getErdDetail = async (erdId) => {
  const response = await apiClient.get(`/erds/${erdId}`);
  return response.data;
};

// ✅ ERD 자동 저장 (2초마다 호출) 예비용으로 남겨두기
export const syncErd = async (erdId, data) => {
  const response = await apiClient.put(`/erds/${erdId}/sync`, data);
  return response.data;
};

// ✅ ERD 활동 로그 저장 (사용자가 직접 클릭 시 호출)
export const commitErd = async (erdId, data) => {
  const response = await apiClient.post(`/erds/${erdId}/commit`, data);
  return response.data;
};

// ✅ 스냅샷 저장
export const saveErdSnapshot = async (erdId) => {
  const response = await apiClient.post(`/erds/${erdId}/snapshots`);
  return response.data;
};

// ✅ Undo (이전 스냅샷으로 되돌리기)
export const undoErdSnapshot = async (erdId) => {
  const response = await apiClient.post(`/erds/${erdId}/undo`);
  return response.data;
};

// ✅ Redo (다음 스냅샷으로 되돌리기)
export const redoErdSnapshot = async (erdId) => {
  const response = await apiClient.post(`/erds/${erdId}/redo`);
  return response.data;
};

// 🗃️ (보관용) 로그 기반 Undo
export const undoErdByLog = async (erdId) => {
  const response = await apiClient.post(`/erds/${erdId}/__log_undo`);
  return response.data;
};

// 🗃️ (보관용) 로그 기반 Redo
export const redoErdByLog = async (erdId) => {
  const response = await apiClient.post(`/erds/${erdId}/__log_redo`);
  return response.data;
};

// ERD 이름 변경
export const updateErdName = async (erdId, newName) => {
  const response = await apiClient.patch(`/erds/${erdId}/name`, {
    name: newName,
  });
  return response.data;
};