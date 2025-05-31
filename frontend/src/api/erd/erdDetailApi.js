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

// ✅ 커밋된 스냅샷 목록 조회
export const fetchCommittedSnapshots = async (erdId) => {
  const response = await apiClient.get(`/erds/${erdId}/snapshots`);
  return response.data;
};

// ✅ 스냅샷 체크아웃
export const checkoutSnapshot = async (erdId, snapshotId) => {
  const response = await apiClient.put(`/erds/${erdId}/checkout/${snapshotId}`);
  return response.data;
};

// ERD 이름 변경
export const updateErdName = async (erdId, newName) => {
  const response = await apiClient.patch(`/erds/${erdId}/name`, {
    name: newName,
  });
  return response.data;
};

// ✅ ERD SQL 내보내기
export const fetchExportedSql = async (erdId, dbms) => {
  const response = await apiClient.get(`/erds/${erdId}/export-sql`, {
    params: { dbms },
  });
  return response.data.sql;
};
