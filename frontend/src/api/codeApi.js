import apiClient from "./apiClient";

// 최상위 폴더 자동 생성 API
export const initRootCodeFolder = async () => {
  const response = await apiClient.post("/freecode/init-root");
  return response.data;
};
