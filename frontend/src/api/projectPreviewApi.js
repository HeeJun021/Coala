import apiClient from "./apiClient";

/**
 * 프로젝트 Git의 JS 코드를 서버에서 실행합니다.
 * @param {string} code - 실행할 JavaScript 코드
 * @returns {Promise<{success: boolean, stdout: string, stderr: string}>}
 */
export const runProjectJs = async (code) => {
  const res = await apiClient.post("/preview/project/js", { code });
  return res.data;
};

/**
 * 프로젝트 Git의 Python 코드를 서버에서 실행합니다.
 * @param {string} code - 실행할 Python 코드
 * @returns {Promise<{success: boolean, stdout: string, stderr: string}>}
 */
export const runProjectPython = async (code) => {
  const res = await apiClient.post("/preview/project/py", { code });
  return res.data;
};
