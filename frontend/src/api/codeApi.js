import apiClient from "./apiClient";

// 최상위 폴더 자동 생성 API
export const initRootCodeFolder = async () => {
  const response = await apiClient.post("/freecode/init-root");
  return response.data;
};

// 하위 폴더 생성
export const createChildFolder = async (folderData) => {
  const res = await apiClient.post("/freecode/folders", folderData);
  return res.data;
};

// 최상위 폴더 조회
export const getRootCodeFolder = async () => {
  const res = await apiClient.get("/freecode/folders/root");
  return res.data;
};

// 특정 폴더의 하위 폴더 조회
export const getChildFolders = async (parentFolderId) => {
  const res = await apiClient.get(`/freecode/folders/${parentFolderId}/children`);
  return res.data;
};

// 코드 파일 저장 (저장 버튼 또는 Ctrl+S 시)
export const saveCodeFile = async (codeData) => {
  const res = await apiClient.post("/freecode/code", codeData);
  return res.data;
};

// 특정 폴더 내 코드 목록 조회
export const getCodesInFolder = async (folderId) => {
  const res = await apiClient.get(`/freecode/folders/${folderId}/codes`);
  return res.data;
};

// 개별 코드 파일 조회
export const getCodeById = async (codeId) => {
  const res = await apiClient.get(`/freecode/codes/${codeId}`);
  return res.data;
};

// 코드 파일 수정
export const updateCodeFile = async (codeId, updateData) => {
  const res = await apiClient.put(`/freecode/codes/${codeId}`, updateData);
  return res.data;
};

// 코드 제목(파일명) 수정
export const renameCodeTitle = async (codeId, newTitle) => {
  const res = await apiClient.patch(`/freecode/codes/${codeId}/title`, {
    title: newTitle,
  });
  return res.data;
};

// 코드 파일 삭제
export const deleteCodeFile = async (codeId) => {
  const res = await apiClient.delete(`/freecode/codes/${codeId}`);
  return res.data;
};

// 폴더 이름 변경
export const renameFolder = async (folderId, newName) => {
  const res = await apiClient.patch(`/freecode/folders/${folderId}/rename`, {
    folder_name: newName,
  });
  return res.data;
};

// 폴더 삭제 (하위 폴더 및 코드 포함)
export const deleteFolder = async (folderId) => {
  const res = await apiClient.delete(`/freecode/folders/${folderId}`);
  return res.data;
};
