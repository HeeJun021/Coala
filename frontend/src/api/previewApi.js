import apiClient from "./apiClient"; // 기존 axios 인스턴스

// JS 코드 실행 요청
export const runJsPreview = async (code) => {
  const res = await apiClient.post("/preview/js", { code });
  return res.data; // 실행 결과 반환 (예: console 출력, 에러 등)
};

export const runHtmlPreview = async (codeId) => {
  const res = await apiClient.get(`/preview/preview-html/by-code/${codeId}`);
  return res.data;
};